/**
 * Example usage of notification system
 * This file demonstrates how to use the notification system
 * for different events in the dropshipping platform.
 */

import { createNotification } from './create';
import { NotificationType } from './types';

/**
 * Example 1: New Order Notification
 * Called when a new order is synced from Shopify
 */
export async function notifyNewOrder(
  dropshipperId: string,
  orderId: string,
  orderNumber: string,
  customerName: string,
  totalAmount: number
) {
  await createNotification(
    dropshipperId,
    NotificationType.NEW_ORDER,
    'New Order Received',
    `Order #${orderNumber} from ${customerName} - $${totalAmount.toFixed(2)}`,
    {
      orderId,
      orderNumber,
      customerName,
      amount: totalAmount,
    }
  );
}

/**
 * Example 2: Order Status Change Notification
 * Called when an order state changes
 */
export async function notifyOrderStatusChange(
  dropshipperId: string,
  orderId: string,
  orderNumber: string,
  oldState: string,
  newState: string
) {
  await createNotification(
    dropshipperId,
    NotificationType.ORDER_STATUS_CHANGE,
    'Order Status Updated',
    `Order #${orderNumber} changed from ${oldState} to ${newState}`,
    {
      orderId,
      orderNumber,
      oldState,
      newState,
    }
  );
}

/**
 * Example 3: Withdrawal Approved Notification
 * Called when admin approves a withdrawal request
 */
export async function notifyWithdrawalApproved(
  dropshipperId: string,
  withdrawalRequestId: string,
  amount: number,
  bankAccount: string
) {
  await createNotification(
    dropshipperId,
    NotificationType.WITHDRAWAL_APPROVED,
    'Withdrawal Approved',
    `Your withdrawal request of $${amount.toFixed(2)} to ${bankAccount} has been approved`,
    {
      withdrawalRequestId,
      amount,
      bankAccount,
    }
  );
}

/**
 * Example 4: Withdrawal Rejected Notification
 * Called when admin rejects a withdrawal request
 */
export async function notifyWithdrawalRejected(
  dropshipperId: string,
  withdrawalRequestId: string,
  amount: number,
  reason?: string
) {
  const message = reason
    ? `Your withdrawal request of $${amount.toFixed(2)} has been rejected. Reason: ${reason}`
    : `Your withdrawal request of $${amount.toFixed(2)} has been rejected`;

  await createNotification(
    dropshipperId,
    NotificationType.WITHDRAWAL_REJECTED,
    'Withdrawal Rejected',
    message,
    {
      withdrawalRequestId,
      amount,
      reason,
    }
  );
}

/**
 * Example 5: Deposit Approved Notification
 * Called when admin approves a deposit
 */
export async function notifyDepositApproved(
  dropshipperId: string,
  depositRequestId: string,
  amount: number
) {
  await createNotification(
    dropshipperId,
    NotificationType.DEPOSIT_APPROVED,
    'Deposit Approved',
    `Your deposit of $${amount.toFixed(2)} has been approved and credited to your wallet`,
    {
      depositRequestId,
      amount,
    }
  );
}

/**
 * Example 6: Deposit Rejected Notification
 * Called when admin rejects a deposit
 */
export async function notifyDepositRejected(
  dropshipperId: string,
  depositRequestId: string,
  amount: number,
  reason?: string
) {
  const message = reason
    ? `Your deposit of $${amount.toFixed(2)} has been rejected. Reason: ${reason}`
    : `Your deposit of $${amount.toFixed(2)} has been rejected`;

  await createNotification(
    dropshipperId,
    NotificationType.DEPOSIT_REJECTED,
    'Deposit Rejected',
    message,
    {
      depositRequestId,
      amount,
      reason,
    }
  );
}

/**
 * Example 7: Low Stock Alert
 * Called when a product's stock falls below threshold
 */
export async function notifyLowStock(
  dropshipperId: string,
  productId: string,
  productName: string,
  productSku: string,
  currentStock: number,
  threshold: number
) {
  await createNotification(
    dropshipperId,
    NotificationType.LOW_STOCK_ALERT,
    'Low Stock Alert',
    `${productName} (${productSku}) is running low. Current stock: ${currentStock} (threshold: ${threshold})`,
    {
      productId,
      productName,
      productSku,
      stockLevel: currentStock,
      threshold,
    }
  );
}

/**
 * Example 8: Support Ticket Created
 * Called when a user creates a support ticket
 */
export async function notifyTicketCreated(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  subject: string
) {
  await createNotification(
    userId,
    NotificationType.TICKET_CREATED,
    'Support Ticket Created',
    `Your support ticket #${ticketNumber} "${subject}" has been created. We'll respond as soon as possible.`,
    {
      ticketId,
      ticketNumber,
      ticketSubject: subject,
    }
  );
}

/**
 * Example 9: Support Ticket Reply
 * Called when support team replies to a ticket
 */
export async function notifyTicketReply(
  userId: string,
  ticketId: string,
  ticketNumber: string,
  subject: string,
  replyPreview: string
) {
  await createNotification(
    userId,
    NotificationType.TICKET_REPLY,
    'New Reply on Your Ticket',
    `Support replied to ticket #${ticketNumber} "${subject}": ${replyPreview}`,
    {
      ticketId,
      ticketNumber,
      ticketSubject: subject,
      replyPreview,
    }
  );
}

/**
 * Example 10: Order Confirmed by Dropshipper
 * Called when a dropshipper confirms they received an order
 */
export async function notifyOrderConfirmed(
  dropshipperId: string,
  orderId: string,
  orderNumber: string,
  customerName: string
) {
  await createNotification(
    dropshipperId,
    NotificationType.ORDER_CONFIRMED,
    'Order Confirmed',
    `You confirmed order #${orderNumber} from ${customerName}. It's now being processed.`,
    {
      orderId,
      orderNumber,
      customerName,
    }
  );
}

/**
 * Example Usage in API Endpoints:
 *
 * // In order sync endpoint
 * await notifyNewOrder(
 *   dropshipperId,
 *   order.id,
 *   order.shopifyOrderId!,
 *   order.customerName,
 *   parseFloat(order.totalAmount.toString())
 * );
 *
 * // In withdrawal review endpoint
 * if (approved) {
 *   await notifyWithdrawalApproved(
 *     request.dropshipperId,
 *     request.id,
 *     parseFloat(request.amount.toString()),
 *     bankAccount.cbu
 *   );
 * } else {
 *   await notifyWithdrawalRejected(
 *     request.dropshipperId,
 *     request.id,
 *     parseFloat(request.amount.toString()),
 *     'Insufficient documentation'
 *   );
 * }
 *
 * // In product stock update
 * if (product.stock < product.lowStockThreshold) {
 *   await notifyLowStock(
 *     dropshipperId,
 *     product.id,
 *     product.name,
 *     product.sku,
 *     product.stock,
 *     product.lowStockThreshold
 *   );
 * }
 */