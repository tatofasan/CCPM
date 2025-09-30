#!/usr/bin/env node

/**
 * Email Worker
 *
 * Background worker process that dequeues and processes email jobs from BullMQ
 *
 * Usage:
 *   node workers/email-worker.ts
 *   or
 *   ts-node workers/email-worker.ts
 *
 * In production, run with a process manager like PM2:
 *   pm2 start workers/email-worker.ts --name email-worker
 */

import { Worker } from 'bullmq';
import { connection } from '@/lib/queue/setup';
import {
  processEmailJob,
  handleEmailJobFailure,
  handleEmailJobComplete,
} from '@/lib/queue/jobs/email';

console.log('[EmailWorker] Starting email worker...');

// Create the worker
const worker = new Worker('email', processEmailJob, {
  connection,
  concurrency: 5, // Process up to 5 emails concurrently
  limiter: {
    max: 100, // Maximum 100 jobs
    duration: 60000, // Per 60 seconds (rate limiting to avoid SendGrid throttling)
  },
});

// Worker event handlers
worker.on('ready', () => {
  console.log('[EmailWorker] Worker is ready and waiting for jobs');
});

worker.on('active', (job) => {
  console.log(`[EmailWorker] Processing job ${job.id}...`);
});

worker.on('completed', async (job, result) => {
  console.log(`[EmailWorker] Job ${job.id} completed successfully`);
  await handleEmailJobComplete(job, result);
});

worker.on('failed', async (job, error) => {
  if (!job) {
    console.error('[EmailWorker] Job failed but job object is undefined');
    return;
  }

  console.error(`[EmailWorker] Job ${job.id} failed: ${error.message}`);
  console.error(`[EmailWorker] Attempt ${job.attemptsMade} of ${job.opts.attempts || 3}`);

  // Only call failure handler if all retries exhausted
  if (job.attemptsMade >= (job.opts.attempts || 3)) {
    await handleEmailJobFailure(job, error);
  }
});

worker.on('error', (error) => {
  console.error('[EmailWorker] Worker error:', error);
});

worker.on('stalled', (jobId) => {
  console.warn(`[EmailWorker] Job ${jobId} has stalled`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('[EmailWorker] Shutting down gracefully...');

  try {
    await worker.close();
    await connection.quit();
    console.log('[EmailWorker] Worker shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('[EmailWorker] Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[EmailWorker] Uncaught exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[EmailWorker] Unhandled rejection at:', promise, 'reason:', reason);
  shutdown();
});

console.log('[EmailWorker] Email worker started successfully');
console.log('[EmailWorker] Concurrency: 5 jobs');
console.log('[EmailWorker] Rate limit: 100 jobs per minute');
console.log('[EmailWorker] Retry policy: 3 attempts with exponential backoff');
console.log('[EmailWorker] Press CTRL+C to stop');

// Keep the process running
process.stdin.resume();