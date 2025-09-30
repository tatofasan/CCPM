import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth/config';
import { closeTicket } from '@/lib/support/tickets';

/**
 * PATCH /api/support/tickets/[id]/close - Close a ticket (creator only)
 */
export async function PATCH(
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

    // Close the ticket
    const ticket = await closeTicket(ticketId, session.user.id);

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error closing ticket:', error);

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

    if (error.message.includes('already closed')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to close ticket' },
      { status: 500 }
    );
  }
}