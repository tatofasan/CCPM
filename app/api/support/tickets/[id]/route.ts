import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth/config';
import { getTicketById } from '@/lib/support/tickets';
import { UserRole } from '@prisma/client';

/**
 * GET /api/support/tickets/[id] - Get ticket details with messages
 */
export async function GET(
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

    // Get ticket
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view this ticket
    const isTicketCreator = ticket.userId === session.user.id;
    const isAssignedAdmin = ticket.assignedTo === session.user.id;
    const isAdminOrSupport = [UserRole.ADMIN, UserRole.SUPPORT].includes(session.user.role as UserRole);

    if (!isTicketCreator && !isAssignedAdmin && !isAdminOrSupport) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot view this ticket' },
        { status: 403 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}