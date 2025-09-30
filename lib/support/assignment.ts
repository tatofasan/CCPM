import { prisma } from '@/lib/prisma';
import { UserRole, TicketStatus } from '@prisma/client';
import { createNotification } from '@/lib/notifications/create';
import { NotificationType } from '@/lib/notifications/types';
import { sendTicketAssignedEmail } from '@/lib/email/sender';
import { shouldSendEmail } from '@/lib/notifications/create';

export interface AssignTicketParams {
  ticketId: string;
  adminUserId: string;
  assignedBy: string;
}

/**
 * Assign a ticket to an admin/support user
 * - Requires ADMIN or SUPPORT role
 * - Updates status to IN_PROGRESS if currently OPEN
 * - Notifies assigned admin
 */
export async function assignTicket(params: AssignTicketParams) {
  try {
    const { ticketId, adminUserId, assignedBy } = params;

    // Verify the user performing the assignment has permission
    const assignerUser = await prisma.user.findUnique({
      where: { id: assignedBy },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!assignerUser) {
      throw new Error('Assigner user not found');
    }

    if (![UserRole.ADMIN, UserRole.SUPPORT].includes(assignerUser.role)) {
      throw new Error('Unauthorized: Only admin or support users can assign tickets');
    }

    // Verify the user being assigned to has permission
    const assigneeUser = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!assigneeUser) {
      throw new Error('Assignee user not found');
    }

    if (![UserRole.ADMIN, UserRole.SUPPORT].includes(assigneeUser.role)) {
      throw new Error('Can only assign tickets to admin or support users');
    }

    // Get current ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        assignedTo: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Update ticket assignment
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: adminUserId,
        // If ticket is OPEN, move it to IN_PROGRESS
        status: ticket.status === TicketStatus.OPEN ? TicketStatus.IN_PROGRESS : ticket.status,
      },
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
      },
    });

    // Send in-app notification to assigned user
    await createNotification(
      adminUserId,
      NotificationType.TICKET_CREATED, // Using TICKET_CREATED as assignment notification
      'Ticket Assigned to You',
      `You have been assigned to ticket: ${ticket.subject}`,
      {
        ticketId: ticket.id,
        subject: ticket.subject,
        priority: ticket.priority,
        assignedBy: assignerUser.email,
      }
    );

    // Send email notification if enabled
    const emailEnabled = await shouldSendEmail(adminUserId, NotificationType.TICKET_CREATED);

    if (emailEnabled) {
      await sendTicketAssignedEmail(assigneeUser.email, {
        ticketId: ticket.id,
        subject: ticket.subject,
        assignedTo: assigneeUser.email,
        priority: ticket.priority,
      });
    }

    return updatedTicket;
  } catch (error) {
    console.error('Error assigning ticket:', error);
    throw error;
  }
}

/**
 * Unassign a ticket (remove assignment)
 */
export async function unassignTicket(ticketId: string, userId: string) {
  try {
    // Verify user has permission
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (![UserRole.ADMIN, UserRole.SUPPORT].includes(user.role)) {
      throw new Error('Unauthorized: Only admin or support users can unassign tickets');
    }

    // Get ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        assignedTo: true,
        status: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (!ticket.assignedTo) {
      throw new Error('Ticket is not assigned');
    }

    // Update ticket to remove assignment
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: null,
        // If ticket is IN_PROGRESS, move it back to OPEN
        status: ticket.status === TicketStatus.IN_PROGRESS ? TicketStatus.OPEN : ticket.status,
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

    return updatedTicket;
  } catch (error) {
    console.error('Error unassigning ticket:', error);
    throw error;
  }
}

/**
 * Get tickets assigned to a specific user
 */
export async function getAssignedTickets(userId: string, includeResolved: boolean = false) {
  try {
    const where: any = {
      assignedTo: userId,
    };

    if (!includeResolved) {
      where.status = {
        notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED],
      };
    }

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
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return tickets;
  } catch (error) {
    console.error('Error fetching assigned tickets:', error);
    throw new Error('Failed to fetch assigned tickets');
  }
}

/**
 * Reassign a ticket from one user to another
 */
export async function reassignTicket(
  ticketId: string,
  newAdminUserId: string,
  reassignedBy: string
) {
  try {
    // Just use the assignTicket function which handles all the logic
    return await assignTicket({
      ticketId,
      adminUserId: newAdminUserId,
      assignedBy: reassignedBy,
    });
  } catch (error) {
    console.error('Error reassigning ticket:', error);
    throw error;
  }
}