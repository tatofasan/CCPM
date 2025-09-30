import sgMail from '@sendgrid/mail';
import { env } from '@/lib/env';

// Initialize SendGrid client
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY);
}

export interface EmailDeliveryStatus {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: 'delivered' | 'bounced' | 'failed';
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}

/**
 * Send email using SendGrid
 * Handles delivery tracking and error handling
 *
 * @param params - Email parameters
 * @returns Delivery status with tracking information
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<EmailDeliveryStatus> {
  try {
    // Validate SendGrid is configured
    if (!env.SENDGRID_API_KEY) {
      console.warn('[Email] SendGrid API key not configured, skipping email send');
      return {
        success: false,
        error: 'SendGrid API key not configured',
        status: 'failed',
      };
    }

    if (!env.EMAIL_FROM) {
      console.warn('[Email] EMAIL_FROM not configured, skipping email send');
      return {
        success: false,
        error: 'EMAIL_FROM not configured',
        status: 'failed',
      };
    }

    const { to, subject, html, text, from, fromName } = params;

    // Prepare email message
    const msg = {
      to: Array.isArray(to) ? to : [to],
      from: {
        email: from || env.EMAIL_FROM,
        name: fromName || env.EMAIL_FROM_NAME,
      },
      subject,
      html,
      text: text || stripHtml(html),
    };

    console.log(`[Email] Sending email to ${Array.isArray(to) ? to.join(', ') : to}: ${subject}`);

    // Send email via SendGrid
    const response = await sgMail.send(msg);

    // Extract message ID from response
    const messageId = response[0]?.headers?.['x-message-id'] as string;

    console.log(`[Email] Email sent successfully. Message ID: ${messageId}`);

    return {
      success: true,
      messageId,
      status: 'delivered',
    };
  } catch (error: any) {
    console.error('[Email] Failed to send email:', error);

    // Handle SendGrid-specific errors
    let errorMessage = 'Unknown error';
    let status: 'bounced' | 'failed' = 'failed';

    if (error.response) {
      errorMessage = error.response.body?.errors?.[0]?.message || error.message;

      // Determine if it's a bounce or failure
      const statusCode = error.code || error.response.statusCode;
      if (statusCode >= 400 && statusCode < 500) {
        status = 'bounced'; // Client error (invalid email, etc.)
      }
    } else {
      errorMessage = error.message || 'Failed to send email';
    }

    return {
      success: false,
      error: errorMessage,
      status,
    };
  }
}

/**
 * Strip HTML tags from string for plain text fallback
 * Basic implementation - can be enhanced with a library if needed
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>.*<\/style>/gm, '')
    .replace(/<script[^>]*>.*<\/script>/gm, '')
    .replace(/<[^>]+>/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Send multiple emails in batch
 * Uses SendGrid's batch sending capability
 *
 * @param emails - Array of email parameters
 * @returns Array of delivery statuses
 */
export async function sendEmailBatch(
  emails: SendEmailParams[]
): Promise<EmailDeliveryStatus[]> {
  const results = await Promise.allSettled(
    emails.map((email) => sendEmail(email))
  );

  return results.map((result) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        error: result.reason?.message || 'Failed to send email',
        status: 'failed' as const,
      };
    }
  });
}