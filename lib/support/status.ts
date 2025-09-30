import { prisma } from '@/lib/prisma';
import { TicketStatus, UserRole, TicketPriority } from '@prisma/client';
import { createNotification } from '@/lib/notifications/create';
import { NotificationType } from '@/lib/notifications/types';
import { sendTicketStatusChangeEmail } from '@/lib/email/sender';
import { shouldSendEmail } from '@/lib/notifications/create';

export interface UpdateStatusParams {
  ticketId: string;
  newStatus: TicketStatus;
  userId: string;
}

export interface UpdatePriorityParams {
  ticketId: string;
  newPriority: TicketPriority;
  userId: string;
}

/**
 * Valid ticket status transitions
 * OPEN → IN_PROGRESS → RESOLVED → CLOSED
 * Cannot reopen CLOSED tickets
 */
const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [
    TicketStatus.IN_PROGRESS,
    TicketStatus.CLOSED, // User can close immediately
  ],
  [TicketStatus.IN_PROGRESS]: [
    TicketStatus.OPEN, // Can move back to open
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ],
  [TicketStatus.RESOLVED]: [
    TicketStatus.IN_PROGRESS, // Can reopen if needed
    TicketStatus.CLOSED,
  ],
  [TicketStatus.CLOSED]: [], // Cannot transition from closed
};

/**
 * Check if a status transition is valid
 */
function isValidTransition(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
  if (currentStatus === newStatus) {
    return false; // No change
  }

  return VALID_TRANSITIONS[currentStatus].includes(newStatus);
}

/**
 * Update ticket status
 * - Validates status transition
 * - Requires ADMIN or SUPPORT role (except for closing own ticket)
 * - Notifies ticket creator on status change
 */
export async function updateTicketStatus(params: UpdateStatusParams) {
  try {
    const { ticketId, newStatus, userId } = params;

    // Get current ticket
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
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Get user performing the update
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check permissions
    const isTicketCreator = ticket.userId === userId;
    const isAdminOrSupport = [UserRole.ADMIN, UserRole.SUPPORT].includes(user.role);

    // Users can only close their own tickets
    if (isTicketCreator && newStatus === TicketStatus.CLOSED) {
      // Allow closing own ticket
    } else if (!isAdminOrSupport) {
      throw new Error('Unauthorized: Only admin or support users can change ticket status');
    }

    // Validate status transition
    if (!isValidTransition(ticket.status, newStatus)) {
      throw new Error(
        `Invalid status transition: Cannot change from ${ticket.status} to ${newStatus}`
      );
    }

    // Update ticket status
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
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

    // Notify ticket creator about status change (if they didn't make the change)
    if (ticket.userId !== userId) {
      await createNotification(
        ticket.userId,
        NotificationType.ORDER_STATUS_CHANGE, // Reusing this type for ticket status changes
        'Ticket Status Updated',
        `Your ticket "${ticket.subject}" status changed from ${ticket.status} to ${newStatus}`,
        {
          ticketId: ticket.id,
          subject: ticket.subject,
          oldStatus: ticket.status,
          newStatus,
        }
      );

      // Send email notification if enabled
      const emailEnabled = await shouldSendEmail(
        ticket.userId,
        NotificationType.ORDER_STATUS_CHANGE
      );

      if (emailEnabled) {
        await sendTicketStatusChangeEmail(ticket.user.email, {
          ticketId: ticket.id,
          subject: ticket.subject,
          oldStatus: ticket.status,
          newStatus,
        });
      }
    }

    return updatedTicket;
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
}

/**
 * Update ticket priority
 * Requires ADMIN or SUPPORT role
 */
export async function updateTicketPriority(params: UpdatePriorityParams) {
  try {
    const { ticketId, newPriority, userId } = params;

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
      throw new Error('Unauthorized: Only admin or support users can change ticket priority');
    }

    // Get current ticket
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        priority: true,
      },
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (ticket.priority === newPriority) {
      throw new Error('Priority is already set to this value');
    }

    // Update ticket priority
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        priority: newPriority,
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

    return updatedTicket;
  } catch (error) {
    console.error('Error updating ticket priority:', error);
    throw error;
  }
}

/**
 * Reopen a resolved ticket
 * Can be done by ticket creator or admin/support
 */
export async function reopenTicket(ticketId: string, userId: string) {
  try {
    return await updateTicketStatus({
      ticketId,
      newStatus: TicketStatus.IN_PROGRESS,
      userId,
    });
  } catch (error) {
    console.error('Error reopening ticket:', error);
    throw error;
  }
}

/**
 * Mark ticket as resolved
 * Only admin/support can do this
 */
export async function resolveTicket(ticketId: string, userId: string) {
  try {
    return await updateTicketStatus({
      ticketId,
      newStatus: TicketStatus.RESOLVED,
      userId,
    });
  } catch (error) {
    console.error('Error resolving ticket:', error);
    throw error;
  }
}