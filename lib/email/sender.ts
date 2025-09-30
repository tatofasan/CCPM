import { render } from '@react-email/render';
import { emailQueue } from '@/lib/queue/setup';
import { env } from '@/lib/env';

// Import email templates
import NewOrderEmail from './templates/new-order';
import OrderConfirmedEmail from './templates/order-confirmed';
import OrderStatusChangeEmail from './templates/order-status-change';
import WithdrawalApprovedEmail from './templates/withdrawal-approved';
import WithdrawalRejectedEmail from './templates/withdrawal-rejected';
import DepositApprovedEmail from './templates/deposit-approved';
import DepositRejectedEmail from './templates/deposit-rejected';
import LowStockAlertEmail from './templates/low-stock-alert';

export type EmailTemplate =
  | 'new-order'
  | 'order-confirmed'
  | 'order-status-change'
  | 'withdrawal-approved'
  | 'withdrawal-rejected'
  | 'deposit-approved'
  | 'deposit-rejected'
  | 'low-stock-alert';

export interface EmailJobData {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  variables: Record<string, any>;
}

/**
 * Get the React Email component for a given template
 */
function getTemplateComponent(template: EmailTemplate, variables: Record<string, any>) {
  const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Inject appUrl into variables if not present
  const templateVars = { ...variables, appUrl: variables.appUrl || appUrl };

  switch (template) {
    case 'new-order':
      return NewOrderEmail(templateVars as any);
    case 'order-confirmed':
      return OrderConfirmedEmail(templateVars as any);
    case 'order-status-change':
      return OrderStatusChangeEmail(templateVars as any);
    case 'withdrawal-approved':
      return WithdrawalApprovedEmail(templateVars as any);
    case 'withdrawal-rejected':
      return WithdrawalRejectedEmail(templateVars as any);
    case 'deposit-approved':
      return DepositApprovedEmail(templateVars as any);
    case 'deposit-rejected':
      return DepositRejectedEmail(templateVars as any);
    case 'low-stock-alert':
      return LowStockAlertEmail(templateVars as any);
    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

/**
 * Render email template to HTML
 */
export async function renderEmailTemplate(
  template: EmailTemplate,
  variables: Record<string, any>
): Promise<string> {
  try {
    const component = getTemplateComponent(template, variables);
    const html = render(component);
    return html;
  } catch (error) {
    console.error(`[Email] Failed to render template ${template}:`, error);
    throw error;
  }
}

/**
 * Queue an email for sending
 * This is the primary interface for sending emails throughout the application
 *
 * @param to - Recipient email address(es)
 * @param subject - Email subject line
 * @param template - Template name to use
 * @param variables - Variables to inject into template
 * @returns Job ID for tracking
 */
export async function queueEmail(
  to: string | string[],
  subject: string,
  template: EmailTemplate,
  variables: Record<string, any>
): Promise<string> {
  try {
    const jobData: EmailJobData = {
      to,
      subject,
      template,
      variables,
    };

    console.log(`[Email] Queueing email to ${Array.isArray(to) ? to.join(', ') : to}: ${subject}`);

    const job = await emailQueue.add('send-email', jobData);

    console.log(`[Email] Email queued successfully. Job ID: ${job.id}`);

    return job.id || 'unknown';
  } catch (error) {
    console.error('[Email] Failed to queue email:', error);
    throw error;
  }
}

/**
 * Helper functions for common email types
 */

export async function sendNewOrderEmail(
  to: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    customerEmail?: string;
    totalAmount: string;
    itemCount: number;
  }
) {
  return queueEmail(
    to,
    `New Order #${orderData.orderNumber}`,
    'new-order',
    orderData
  );
}

export async function sendOrderConfirmedEmail(
  to: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    totalAmount: string;
    estimatedDelivery?: string;
  }
) {
  return queueEmail(
    to,
    `Order #${orderData.orderNumber} Confirmed`,
    'order-confirmed',
    orderData
  );
}

export async function sendOrderStatusChangeEmail(
  to: string,
  orderData: {
    orderNumber: string;
    customerName: string;
    oldStatus: string;
    newStatus: string;
    statusMessage: string;
    trackingNumber?: string;
  }
) {
  return queueEmail(
    to,
    `Order #${orderData.orderNumber} Status Update`,
    'order-status-change',
    orderData
  );
}

export async function sendWithdrawalApprovedEmail(
  to: string,
  withdrawalData: {
    userName: string;
    amount: string;
    bankAccount: string;
    referenceNumber: string;
    estimatedDate?: string;
  }
) {
  return queueEmail(
    to,
    'Withdrawal Request Approved',
    'withdrawal-approved',
    withdrawalData
  );
}

export async function sendWithdrawalRejectedEmail(
  to: string,
  withdrawalData: {
    userName: string;
    amount: string;
    reason: string;
  }
) {
  return queueEmail(
    to,
    'Withdrawal Request Not Approved',
    'withdrawal-rejected',
    withdrawalData
  );
}

export async function sendDepositApprovedEmail(
  to: string,
  depositData: {
    userName: string;
    amount: string;
    newBalance: string;
    referenceNumber: string;
  }
) {
  return queueEmail(
    to,
    'Deposit Credited to Your Account',
    'deposit-approved',
    depositData
  );
}

export async function sendDepositRejectedEmail(
  to: string,
  depositData: {
    userName: string;
    amount: string;
    reason: string;
  }
) {
  return queueEmail(
    to,
    'Deposit Request Not Approved',
    'deposit-rejected',
    depositData
  );
}

export async function sendLowStockAlertEmail(
  to: string | string[],
  productData: {
    productName: string;
    sku: string;
    currentStock: number;
    threshold: number;
    supplierName: string;
  }
) {
  return queueEmail(
    to,
    `Low Stock Alert: ${productData.productName}`,
    'low-stock-alert',
    productData
  );
}