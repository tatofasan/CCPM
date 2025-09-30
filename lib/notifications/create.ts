import { prisma } from '@/lib/prisma';
import {
  NotificationType,
  NotificationChannel,
  NotificationMetadata,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferences,
} from './types';

/**
 * Get or create user notification preferences
 */
async function getUserPreferences(userId: string) {
  let preference = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  // Create default preferences if they don't exist
  if (!preference) {
    preference = await prisma.notificationPreference.create({
      data: {
        userId,
        emailEnabled: true,
        inappEnabled: true,
        preferences: DEFAULT_NOTIFICATION_PREFERENCES as any,
      },
    });
  }

  return preference;
}

/**
 * Check if user has enabled a specific notification type for a channel
 */
function isNotificationEnabled(
  preferences: any,
  type: NotificationType,
  channel: NotificationChannel
): boolean {
  try {
    const prefs = preferences.preferences as NotificationPreferences;

    // Check global channel setting
    if (channel === NotificationChannel.EMAIL && !preferences.emailEnabled) {
      return false;
    }
    if (channel === NotificationChannel.INAPP && !preferences.inappEnabled) {
      return false;
    }

    // Check type-specific setting
    if (prefs[type] && prefs[type][channel] !== undefined) {
      return prefs[type][channel];
    }

    // Default to enabled if not specified
    return true;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    // Default to enabled on error
    return true;
  }
}

/**
 * Create a notification for a user
 * Checks user preferences before creating
 * Returns the created notification or null if not created due to preferences
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: NotificationMetadata
) {
  try {
    // Get user preferences
    const userPreferences = await getUserPreferences(userId);

    // Check if in-app notifications are enabled for this type
    const inappEnabled = isNotificationEnabled(
      userPreferences,
      type,
      NotificationChannel.INAPP
    );

    if (!inappEnabled) {
      console.log(
        `In-app notification disabled for user ${userId}, type ${type}`
      );
      return null;
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: (metadata || null) as any,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

/**
 * Create multiple notifications at once
 * Useful for broadcasting to multiple users
 */
export async function createBulkNotifications(
  notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: NotificationMetadata;
  }>
) {
  try {
    const results = await Promise.allSettled(
      notifications.map((notif) =>
        createNotification(
          notif.userId,
          notif.type,
          notif.title,
          notif.message,
          notif.metadata
        )
      )
    );

    const created = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return { created, failed };
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw new Error('Failed to create bulk notifications');
  }
}

/**
 * Check if email notification should be sent for a notification type
 * Used by the email system (Stream A)
 */
export async function shouldSendEmail(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  try {
    const userPreferences = await getUserPreferences(userId);
    return isNotificationEnabled(
      userPreferences,
      type,
      NotificationChannel.EMAIL
    );
  } catch (error) {
    console.error('Error checking email notification preference:', error);
    // Default to enabled on error
    return true;
  }
}