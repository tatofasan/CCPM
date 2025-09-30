import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth/config';
import { listTickets, getTicketStats } from '@/lib/support/tickets';
import { TicketPriority, TicketStatus, UserRole } from '@prisma/client';

/**
 * GET /api/admin/support/tickets - List all tickets with filters (admin only)
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);

    // Check if stats are requested
    if (searchParams.get('stats') === 'true') {
      const stats = await getTicketStats();
      return NextResponse.json(stats);
    }

    // Parse query parameters
    const userId = searchParams.get('userId') || undefined;
    const status = searchParams.get('status') as TicketStatus | null;
    const priority = searchParams.get('priority') as TicketPriority | null;
    const assignedTo = searchParams.get('assignedTo') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'priority' || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Build filters
    const filters: any = {};

    if (userId) {
      filters.userId = userId;
    }

    if (status) {
      filters.status = status;
    }

    if (priority) {
      filters.priority = priority;
    }

    if (assignedTo) {
      filters.assignedTo = assignedTo;
    }

    if (search) {
      filters.search = search;
    }

    // Get tickets
    const result = await listTickets(filters, {
      page,
      limit,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing tickets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list tickets' },
      { status: 500 }
    );
  }
}