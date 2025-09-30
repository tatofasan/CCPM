import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/notifications/stream
 * Server-Sent Events endpoint for real-time notification delivery
 */
export async function GET(request: NextRequest) {
  // Verify authentication
  const user = await verifyAuth(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Create a readable stream for SSE
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({ type: 'connected', userId: user.userId })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Track last notification timestamp to avoid duplicates
      let lastCheckTimestamp = new Date();

      // Poll for new notifications every 5 seconds
      const intervalId = setInterval(async () => {
        try {
          // Fetch new notifications since last check
          const newNotifications = await prisma.notification.findMany({
            where: {
              userId: user.userId,
              createdAt: {
                gt: lastCheckTimestamp,
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          // Update last check timestamp
          if (newNotifications.length > 0) {
            lastCheckTimestamp = new Date();

            // Send each new notification
            for (const notification of newNotifications) {
              const message = `data: ${JSON.stringify({
                type: 'notification',
                data: notification,
              })}\n\n`;
              controller.enqueue(encoder.encode(message));
            }
          }

          // Send periodic heartbeat to keep connection alive
          const heartbeat = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));
        } catch (error) {
          console.error('Error in SSE stream:', error);
          // Don't close the stream on error, just log it
        }
      }, 5000); // Poll every 5 seconds

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  });
}

/**
 * Note: This is a basic SSE implementation using polling.
 * For production use, consider:
 * 1. Using Redis Pub/Sub for scalability across multiple server instances
 * 2. Implementing WebSockets for true real-time push
 * 3. Using a dedicated service like Pusher, Ably, or Socket.io
 * 4. Implementing connection management and rate limiting
 */