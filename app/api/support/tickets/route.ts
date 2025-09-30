import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth/config';
import { createTicket, listTickets } from '@/lib/support/tickets';
import { TicketPriority, TicketStatus } from '@prisma/client';

/**
 * POST /api/support/tickets - Create a new support ticket
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions, req);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subject, description, priority } = body;

    // Validate required fields
    if (!subject || !description) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !Object.values(TicketPriority).includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority value' },
        { status: 400 }
      );
    }

    // Create the ticket
    const ticket = await createTicket({
      userId: session.user.id,
      subject,
      description,
      priority: priority || TicketPriority.MEDIUM,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error: any) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/support/tickets - List user's tickets
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

    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const status = searchParams.get('status') as TicketStatus | null;
    const priority = searchParams.get('priority') as TicketPriority | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'priority' || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc';

    // Build filters
    const filters: any = {
      userId: session.user.id,
    };

    if (status) {
      filters.status = status;
    }

    if (priority) {
      filters.priority = priority;
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