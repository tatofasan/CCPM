import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/notifications/mark-all-read
 * Mark all user's notifications as read
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  try {
    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: user.userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({
      message: 'All notifications marked as read',
      count: result.count,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}