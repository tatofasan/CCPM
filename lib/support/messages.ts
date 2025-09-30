import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import { createNotification } from '@/lib/notifications/create';
import { NotificationType } from '@/lib/notifications/types';
import { sendTicketReplyEmail } from '@/lib/email/sender';
import { shouldSendEmail } from '@/lib/notifications/create';

export interface AddMessageParams {
  ticketId: string;
  userId: string;
  message: string;
}

/**
 * Add a message to a ticket
 * - Updates ticket.updated_at
 * - Sends notification to ticket participants
 * - If user is admin → notify ticket creator
 * - If user is creator → notify assigned admin
 */
export async function addMessage(params: AddMessageParams) {
  try {
    const { ticketId, userId, message } = params;

    // Get ticket with user and assigned admin info
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

    // Get the user who is posting the message
    const messageAuthor = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!messageAuthor) {
      throw new Error('User not found');
    }

    // Verify user has permission to post
    // Either ticket creator, assigned admin, or any admin/support user
    const isTicketCreator = ticket.userId === userId;
    const isAssignedAdmin = ticket.assignedTo === userId;
    const isAdminOrSupport = [UserRole.ADMIN, UserRole.SUPPORT].includes(messageAuthor.role);

    if (!isTicketCreator && !isAssignedAdmin && !isAdminOrSupport) {
      throw new Error('Unauthorized: You cannot post to this ticket');
    }

    // Create the message
    const ticketMessage = await prisma.ticketMessage.create({
      data: {
        ticketId,
        userId,
        message,
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

    // Update ticket's updated_at timestamp
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        updatedAt: new Date(),
      },
    });

    // Determine who to notify
    const notificationRecipients: Array<{ id: string; email: string }> = [];

    if (isAdminOrSupport) {
      // Admin/Support replied → notify ticket creator
      if (ticket.user.id !== userId) {
        notificationRecipients.push(ticket.user);
      }
    } else {
      // Ticket creator replied → notify assigned admin (if any)
      if (ticket.assigned) {
        notificationRecipients.push(ticket.assigned);
      } else {
        // If not assigned, notify all admin/support users
        const supportUsers = await prisma.user.findMany({
          where: {
            role: {
              in: [UserRole.ADMIN, UserRole.SUPPORT],
            },
            status: 'ACTIVE',
            id: {
              not: userId, // Don't notify the message sender
            },
          },
          select: {
            id: true,
            email: true,
          },
        });
        notificationRecipients.push(...supportUsers);
      }
    }

    // Send in-app notifications
    await Promise.allSettled(
      notificationRecipients.map((recipient) =>
        createNotification(
          recipient.id,
          NotificationType.TICKET_REPLY,
          `New Reply on Ticket: ${ticket.subject}`,
          `${messageAuthor.email} replied: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
          {
            ticketId: ticket.id,
            messageId: ticketMessage.id,
            subject: ticket.subject,
          }
        )
      )
    );

    // Send email notifications
    for (const recipient of notificationRecipients) {
      const emailEnabled = await shouldSendEmail(recipient.id, NotificationType.TICKET_REPLY);

      if (emailEnabled) {
        await sendTicketReplyEmail(recipient.email, {
          ticketId: ticket.id,
          subject: ticket.subject,
          replyFrom: messageAuthor.email,
          message,
        });
      }
    }

    return ticketMessage;
  } catch (error) {
    console.error('Error adding message:', error);
    throw error;
  }
}

/**
 * Get all messages for a ticket
 */
export async function getTicketMessages(ticketId: string) {
  try {
    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId },
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
    });

    return messages;
  } catch (error) {
    console.error('Error fetching ticket messages:', error);
    throw new Error('Failed to fetch ticket messages');
  }
}

/**
 * Get message count for a ticket
 */
export async function getMessageCount(ticketId: string): Promise<number> {
  try {
    const count = await prisma.ticketMessage.count({
      where: { ticketId },
    });

    return count;
  } catch (error) {
    console.error('Error counting messages:', error);
    throw new Error('Failed to count messages');
  }
}

/**
 * Delete a message (admin only)
 */
export async function deleteMessage(messageId: string, userId: string) {
  try {
    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || ![UserRole.ADMIN, UserRole.SUPPORT].includes(user.role)) {
      throw new Error('Unauthorized: Only admins can delete messages');
    }

    // Delete the message
    await prisma.ticketMessage.delete({
      where: { id: messageId },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
}