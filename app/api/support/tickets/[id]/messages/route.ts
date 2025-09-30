import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth/config';
import { addMessage } from '@/lib/support/messages';

/**
 * POST /api/support/tickets/[id]/messages - Add a message to a ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions, req);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const ticketId = params.id;
    const body = await req.json();
    const { message } = body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Add message to ticket
    const ticketMessage = await addMessage({
      ticketId,
      userId: session.user.id,
      message: message.trim(),
    });

    return NextResponse.json(ticketMessage, { status: 201 });
  } catch (error: any) {
    console.error('Error adding message:', error);

    // Handle specific error messages
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to add message' },
      { status: 500 }
    );
  }
}