import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth/config';
import { assignTicket, unassignTicket } from '@/lib/support/assignment';
import { UserRole } from '@prisma/client';

/**
 * PATCH /api/admin/support/tickets/[id]/assign - Assign or unassign a ticket
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
    const { adminUserId } = body;

    // If adminUserId is null or empty, unassign the ticket
    if (!adminUserId) {
      const ticket = await unassignTicket(ticketId, session.user.id);
      return NextResponse.json(ticket);
    }

    // Assign the ticket
    const ticket = await assignTicket({
      ticketId,
      adminUserId,
      assignedBy: session.user.id,
    });

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error assigning ticket:', error);

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
      { error: error.message || 'Failed to assign ticket' },
      { status: 500 }
    );
  }
}