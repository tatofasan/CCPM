import { prisma } from '@/lib/prisma';

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Creates a notification for a user
 */
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata || {},
    },
  });
}

/**
 * Creates notifications for multiple users (bulk)
 */
export async function createBulkNotifications(
  userIds: string[],
  notification: Omit<CreateNotificationInput, 'userId'>
) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata || {},
    })),
  });
}