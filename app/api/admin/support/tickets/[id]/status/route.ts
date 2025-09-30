import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth/config';
import { updateTicketStatus } from '@/lib/support/status';
import { TicketStatus, UserRole } from '@prisma/client';

/**
 * PATCH /api/admin/support/tickets/[id]/status - Update ticket status
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

    // Check if user is admin or support
    if (![UserRole.ADMIN, UserRole.SUPPORT].includes(session.user.role as UserRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or support role required' },
        { status: 403 }
      );
    }

    const ticketId = params.id;
    const body = await req.json();
    const { status } = body;

    // Validate status
    if (!status || !Object.values(TicketStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Update ticket status
    const ticket = await updateTicketStatus({
      ticketId,
      newStatus: status,
      userId: session.user.id,
    });

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error updating ticket status:', error);

    // Handle specific error messages
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('Invalid status transition')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update ticket status' },
      { status: 500 }
    );
  }
}