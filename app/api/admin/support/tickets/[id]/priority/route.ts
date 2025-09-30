import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth/config';
import { updateTicketPriority } from '@/lib/support/status';
import { TicketPriority, UserRole } from '@prisma/client';

/**
 * PATCH /api/admin/support/tickets/[id]/priority - Update ticket priority
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
    const { priority } = body;

    // Validate priority
    if (!priority || !Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      );
    }

    // Update ticket priority
    const ticket = await updateTicketPriority({
      ticketId,
      newPriority: priority,
      userId: session.user.id,
    });

    return NextResponse.json(ticket);
  } catch (error: any) {
    console.error('Error updating ticket priority:', error);

    // Handle specific error messages
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error.message.includes('already set')) {
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
      { error: error.message || 'Failed to update ticket priority' },
      { status: 500 }
    );
  }
}