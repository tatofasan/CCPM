import { Job } from 'bullmq';
import { sendEmail } from '@/lib/email/client';
import { renderEmailTemplate, EmailJobData } from '@/lib/email/sender';

/**
 * Email job processor
 * Handles rendering templates and sending emails via SendGrid
 *
 * This function is called by the email worker for each job in the queue
 *
 * @param job - BullMQ job containing email data
 * @returns Result object with success status
 */
export async function processEmailJob(job: Job<EmailJobData>) {
  const { to, subject, template, variables } = job.data;

  console.log(`[EmailJob] Processing job ${job.id}: ${template} to ${Array.isArray(to) ? to.join(', ') : to}`);

  try {
    // Step 1: Render the email template with variables
    console.log(`[EmailJob] Rendering template: ${template}`);
    const html = await renderEmailTemplate(template, variables);

    // Step 2: Send the email via SendGrid
    console.log(`[EmailJob] Sending email via SendGrid`);
    const result = await sendEmail({
      to,
      subject,
      html,
    });

    if (!result.success) {
      // Email failed to send - throw error to trigger retry
      throw new Error(result.error || 'Failed to send email');
    }

    console.log(`[EmailJob] Job ${job.id} completed successfully. Message ID: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId,
      status: result.status,
    };
  } catch (error: any) {
    console.error(`[EmailJob] Job ${job.id} failed:`, error);

    // Log error details for debugging
    const errorMessage = error.message || 'Unknown error';
    console.error(`[EmailJob] Error details: ${errorMessage}`);

    // Throw error to trigger BullMQ retry logic
    throw new Error(`Email job failed: ${errorMessage}`);
  }
}

/**
 * Email job failure handler
 * Called when a job fails after all retries
 *
 * @param job - Failed job
 * @param error - Error that caused the failure
 */
export async function handleEmailJobFailure(job: Job<EmailJobData>, error: Error) {
  const { to, subject, template } = job.data;

  console.error(`[EmailJob] Job ${job.id} failed permanently after all retries`);
  console.error(`[EmailJob] Template: ${template}`);
  console.error(`[EmailJob] To: ${Array.isArray(to) ? to.join(', ') : to}`);
  console.error(`[EmailJob] Subject: ${subject}`);
  console.error(`[EmailJob] Error: ${error.message}`);

  // TODO: Log to database or monitoring service
  // TODO: Send alert to admin if critical email type
  // TODO: Create fallback notification in-app

  // For critical emails (order confirmations, withdrawals), we might want to:
  // 1. Create an in-app notification as fallback
  // 2. Alert admin via monitoring service
  // 3. Log to database for manual retry

  const criticalTemplates = ['withdrawal-approved', 'deposit-approved', 'order-confirmed'];
  if (criticalTemplates.includes(template)) {
    console.error(`[EmailJob] CRITICAL: Failed to send critical email type: ${template}`);
    // TODO: Implement critical email failure handling
    // - Create in-app notification
    // - Alert admin
    // - Log for manual review
  }
}

/**
 * Email job completion handler
 * Called when a job completes successfully
 *
 * @param job - Completed job
 * @param result - Result from the job processor
 */
export async function handleEmailJobComplete(
  job: Job<EmailJobData>,
  result: { success: boolean; messageId?: string; status?: string }
) {
  console.log(`[EmailJob] Job ${job.id} completed`);
  console.log(`[EmailJob] Message ID: ${result.messageId}`);
  console.log(`[EmailJob] Status: ${result.status}`);

  // TODO: Log delivery status to database
  // This could be used for:
  // - Email delivery tracking
  // - Analytics on email open rates
  // - Debugging email issues
}