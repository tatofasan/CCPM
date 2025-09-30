#!/usr/bin/env node

/**
 * Shopify Webhook Worker
 *
 * Background worker process that dequeues and processes Shopify webhook jobs from BullMQ
 *
 * This worker:
 * - Processes orders/create webhooks from Shopify
 * - Maps Shopify order data to database schema
 * - Creates orders and order items in the database
 * - Updates Shopify connection sync status
 * - Sends notifications to dropshippers
 * - Handles errors with automatic retry logic
 *
 * Usage:
 *   node workers/shopify-webhook-processor.ts
 *   or
 *   ts-node workers/shopify-webhook-processor.ts
 *
 * In production, run with a process manager like PM2:
 *   pm2 start workers/shopify-webhook-processor.ts --name shopify-webhook-worker
 *
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - REDIS_URL: Redis connection string for BullMQ
 *   - SHOPIFY_WEBHOOK_SECRET: Secret for webhook signature verification
 */

import { Worker } from 'bullmq'
import { connection } from '@/lib/queue/setup'
import {
  processShopifyWebhookJob,
  handleShopifyWebhookJobFailure,
  handleShopifyWebhookJobComplete,
} from '@/lib/queue/jobs/shopify-webhook'

console.log('[ShopifyWebhookWorker] Starting Shopify webhook worker...')

// Create the worker
const worker = new Worker('shopify-webhooks', processShopifyWebhookJob, {
  connection,
  concurrency: 3, // Process up to 3 webhooks concurrently
  limiter: {
    max: 50, // Maximum 50 jobs
    duration: 60000, // Per 60 seconds (rate limiting to avoid database overload)
  },
})

// Worker event handlers
worker.on('ready', () => {
  console.log(
    '[ShopifyWebhookWorker] Worker is ready and waiting for webhook jobs'
  )
})

worker.on('active', job => {
  const { payload, shopDomain } = job.data
  console.log(
    `[ShopifyWebhookWorker] Processing job ${job.id}: Order ${payload.id} from ${shopDomain}`
  )
})

worker.on('completed', async (job, result) => {
  console.log(
    `[ShopifyWebhookWorker] Job ${job.id} completed successfully`
  )
  await handleShopifyWebhookJobComplete(job, result)
})

worker.on('failed', async (job, error) => {
  if (!job) {
    console.error(
      '[ShopifyWebhookWorker] Job failed but job object is undefined'
    )
    return
  }

  console.error(
    `[ShopifyWebhookWorker] Job ${job.id} failed: ${error.message}`
  )
  console.error(
    `[ShopifyWebhookWorker] Attempt ${job.attemptsMade} of ${job.opts.attempts || 3}`
  )

  // Only call failure handler if all retries exhausted
  if (job.attemptsMade >= (job.opts.attempts || 3)) {
    await handleShopifyWebhookJobFailure(job, error)
  }
})

worker.on('error', error => {
  console.error('[ShopifyWebhookWorker] Worker error:', error)
})

worker.on('stalled', jobId => {
  console.warn(`[ShopifyWebhookWorker] Job ${jobId} has stalled`)
})

worker.on('progress', (job, progress) => {
  console.log(`[ShopifyWebhookWorker] Job ${job.id} progress: ${progress}%`)
})

// Graceful shutdown
const shutdown = async () => {
  console.log('[ShopifyWebhookWorker] Shutting down gracefully...')

  try {
    await worker.close()
    await connection.quit()
    console.log('[ShopifyWebhookWorker] Worker shut down successfully')
    process.exit(0)
  } catch (error) {
    console.error('[ShopifyWebhookWorker] Error during shutdown:', error)
    process.exit(1)
  }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Handle uncaught errors
process.on('uncaughtException', error => {
  console.error('[ShopifyWebhookWorker] Uncaught exception:', error)
  shutdown()
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(
    '[ShopifyWebhookWorker] Unhandled rejection at:',
    promise,
    'reason:',
    reason
  )
  shutdown()
})

console.log('[ShopifyWebhookWorker] Shopify webhook worker started successfully')
console.log('[ShopifyWebhookWorker] Concurrency: 3 jobs')
console.log('[ShopifyWebhookWorker] Rate limit: 50 jobs per minute')
console.log(
  '[ShopifyWebhookWorker] Retry policy: 3 attempts with exponential backoff'
)
console.log('[ShopifyWebhookWorker] Press CTRL+C to stop')

// Keep the process running
process.stdin.resume()