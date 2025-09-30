/**
 * Notification Types
 * All available notification types in the system
 */
export enum NotificationType {
  // Order notifications
  NEW_ORDER = 'NEW_ORDER',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_STATUS_CHANGE = 'ORDER_STATUS_CHANGE',

  // Financial notifications
  WITHDRAWAL_APPROVED = 'WITHDRAWAL_APPROVED',
  WITHDRAWAL_REJECTED = 'WITHDRAWAL_REJECTED',
  DEPOSIT_APPROVED = 'DEPOSIT_APPROVED',
  DEPOSIT_REJECTED = 'DEPOSIT_REJECTED',

  // Inventory notifications
  LOW_STOCK_ALERT = 'LOW_STOCK_ALERT',

  // Support notifications
  TICKET_CREATED = 'TICKET_CREATED',
  TICKET_REPLY = 'TICKET_REPLY',
}

/**
 * Channel where the notification can be delivered
 */
export enum NotificationChannel {
  EMAIL = 'email',
  INAPP = 'inapp',
}

/**
 * User preferences for a specific notification type
 */
export interface NotificationTypePreference {
  email: boolean;
  inapp: boolean;
}

/**
 * Complete notification preferences structure
 */
export interface NotificationPreferences {
  [NotificationType.NEW_ORDER]: NotificationTypePreference;
  [NotificationType.ORDER_CONFIRMED]: NotificationTypePreference;
  [NotificationType.ORDER_STATUS_CHANGE]: NotificationTypePreference;
  [NotificationType.WITHDRAWAL_APPROVED]: NotificationTypePreference;
  [NotificationType.WITHDRAWAL_REJECTED]: NotificationTypePreference;
  [NotificationType.DEPOSIT_APPROVED]: NotificationTypePreference;
  [NotificationType.DEPOSIT_REJECTED]: NotificationTypePreference;
  [NotificationType.LOW_STOCK_ALERT]: NotificationTypePreference;
  [NotificationType.TICKET_CREATED]: NotificationTypePreference;
  [NotificationType.TICKET_REPLY]: NotificationTypePreference;
}

/**
 * Default notification preferences (all enabled)
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  [NotificationType.NEW_ORDER]: { email: true, inapp: true },
  [NotificationType.ORDER_CONFIRMED]: { email: true, inapp: true },
  [NotificationType.ORDER_STATUS_CHANGE]: { email: true, inapp: true },
  [NotificationType.WITHDRAWAL_APPROVED]: { email: true, inapp: true },
  [NotificationType.WITHDRAWAL_REJECTED]: { email: true, inapp: true },
  [NotificationType.DEPOSIT_APPROVED]: { email: true, inapp: true },
  [NotificationType.DEPOSIT_REJECTED]: { email: true, inapp: true },
  [NotificationType.LOW_STOCK_ALERT]: { email: true, inapp: true },
  [NotificationType.TICKET_CREATED]: { email: true, inapp: true },
  [NotificationType.TICKET_REPLY]: { email: true, inapp: true },
};

/**
 * Notification metadata can contain any additional information
 */
export interface NotificationMetadata {
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  amount?: number;
  productName?: string;
  productSku?: string;
  stockLevel?: number;
  ticketId?: string;
  ticketSubject?: string;
  withdrawalRequestId?: string;
  depositRequestId?: string;
  oldState?: string;
  newState?: string;
  [key: string]: any;
}

/**
 * Notification creation payload
 */
export interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}