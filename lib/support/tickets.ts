import { prisma } from '@/lib/prisma';
import { TicketPriority, TicketStatus, UserRole } from '@prisma/client';
import { createNotification } from '@/lib/notifications/create';
import { NotificationType } from '@/lib/notifications/types';
import { sendTicketCreatedEmail } from '@/lib/email/sender';
import { shouldSendEmail } from '@/lib/notifications/create';

export interface CreateTicketParams {
  userId: string;
  subject: string;
  description: string;
  priority?: TicketPriority;
}

export interface TicketFilters {
  userId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedTo?: string;
  search?: string;
}

export interface TicketListOptions {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create a new support ticket
 * - Auto-sets status to OPEN
 * - Sends notification to admin team (email + in-app)
 * - Creates TICKET_CREATED notification
 */
export async function createTicket(params: CreateTicketParams) {
  try {
    const { userId, subject, description, priority = TicketPriority.MEDIUM } = params;

    // Get user information for notifications
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Create the ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject,
        description,
        priority,
        status: TicketStatus.OPEN,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Get all admin and support users
    const supportUsers = await prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.SUPPORT],
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
      },
    });

    // Send in-app notifications to all support staff
    await Promise.allSettled(
      supportUsers.map((supportUser) =>
        createNotification(
          supportUser.id,
          NotificationType.TICKET_CREATED,
          'New Support Ticket',
          `${user.email} created ticket: ${subject}`,
          {
            ticketId: ticket.id,
            userId: user.id,
            subject,
            priority,
          }
        )
      )
    );

    // Send email notifications to support team
    const supportEmails = supportUsers.map((u) => u.email);

    // Check if any admin has email notifications enabled
    const shouldSendEmails = await Promise.all(
      supportUsers.map((u) => shouldSendEmail(u.id, NotificationType.TICKET_CREATED))
    );

    const emailRecipients = supportEmails.filter((_, idx) => shouldSendEmails[idx]);

    if (emailRecipients.length > 0) {
      await sendTicketCreatedEmail(emailRecipients, {
        ticketId: ticket.id,
        subject: ticket.subject,
        userName: user.email,
        userEmail: user.email,
        description: ticket.description,
        priority: ticket.priority,
      });
    }

    return ticket;
  } catch (error) {
    console.error('Error creating ticket:', error);
    throw new Error('Failed to create support ticket');
  }
}

/**
 * Get ticket by ID with all related data
 */
export async function getTicketById(ticketId: string) {
  try {
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        assigned: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    return ticket;
  } catch (error) {
    console.error('Error fetching ticket:', error);
    throw new Error('Failed to fetch ticket');
  }
}

/**
 * List tickets with filtering and pagination
 */
export async function listTickets(
  filters: TicketFilters = {},
  options: TicketListOptions = {}
) {
  try {
    const {
      userId,
      status,
      priority,
      assignedTo,
      search,
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Build where clause
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.supportTicket.count({ where });

    // Get tickets
    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        assigned: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error listing tickets:', error);
    throw new Error('Failed to list tickets');
  }
}

/**
 * Close a ticket (user can close their own ticket)
 * Only the ticket creator can close their ticket
 */
export async function closeTicket(ticketId: string, userId: string) {
  try {
    // Verify ticket exists and belongs to user
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { userId: true, status: true },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.userId !== userId) {
      throw new Error('Unauthorized: You can only close your own tickets');
    }

    if (ticket.status === TicketStatus.CLOSED) {
      throw new Error('Ticket is already closed');
    }

    // Update ticket status
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: TicketStatus.CLOSED,
      },
      include: {
        user: true,
        assigned: true,
      },
    });

    return updatedTicket;
  } catch (error) {
    console.error('Error closing ticket:', error);
    throw error;
  }
}

/**
 * Get ticket statistics (for admin dashboard)
 */
export async function getTicketStats() {
  try {
    const [
      totalOpen,
      totalInProgress,
      totalResolved,
      totalClosed,
      totalByPriority,
    ] = await Promise.all([
      prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
      prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } }),
      prisma.supportTicket.groupBy({
        by: ['priority'],
        _count: true,
      }),
    ]);

    return {
      byStatus: {
        open: totalOpen,
        inProgress: totalInProgress,
        resolved: totalResolved,
        closed: totalClosed,
      },
      byPriority: totalByPriority.reduce((acc, item) => {
        acc[item.priority.toLowerCase()] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  } catch (error) {
    console.error('Error fetching ticket stats:', error);
    throw new Error('Failed to fetch ticket statistics');
  }
}