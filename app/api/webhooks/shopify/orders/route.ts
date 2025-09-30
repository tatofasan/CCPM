import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookRequest } from '@/lib/shopify/webhook-validator'
import { shopifyWebhookQueue } from '@/lib/queue/setup'
import { getRedisClient } from '@/lib/auth/redis'
import { ShopifyOrder } from '@/lib/shopify/client'

/**
 * Shopify Orders Webhook Endpoint
 *
 * Receives orders/create webhook from Shopify when a new order is placed.
 * This endpoint must respond within 5 seconds or Shopify will retry.
 *
 * Flow:
 * 1. Verify HMAC signature to ensure request is from Shopify
 * 2. Check idempotency (prevent duplicate processing)
 * 3. Queue webhook for async processing
 * 4. Return 200 OK immediately
 *
 * The actual order processing happens in the worker to avoid blocking Shopify.
 *
 * @see /workers/shopify-webhook-processor.ts
 * @see /lib/queue/jobs/shopify-webhook.ts
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Step 1: Read raw body (required for HMAC verification)
    const body = await request.text()

    console.log(`[ShopifyWebhook] Received webhook, size: ${body.length} bytes`)

    // Step 2: Extract headers needed for validation
    const headers = request.headers

    // Step 3: Validate webhook signature and extract metadata
    let metadata
    try {
      metadata = validateWebhookRequest(body, headers)
      console.log(`[ShopifyWebhook] Signature validated for shop: ${metadata.domain}`)
    } catch (error: any) {
      console.error(`[ShopifyWebhook] Signature validation failed:`, error.message)
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Step 4: Parse the webhook payload
    let payload: ShopifyOrder
    try {
      payload = JSON.parse(body)
      console.log(
        `[ShopifyWebhook] Parsed order: ${payload.id} (${payload.name}) from ${metadata.domain}`
      )
    } catch (error) {
      console.error(`[ShopifyWebhook] Failed to parse JSON body`)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Step 5: Check idempotency with Redis
    // Use Shopify order ID as idempotency key
    const idempotencyKey = `shopify:order:${payload.id}`
    const redis = getRedisClient()

    try {
      const exists = await redis.get(idempotencyKey)

      if (exists) {
        console.log(
          `[ShopifyWebhook] Duplicate webhook detected for order ${payload.id}, skipping`
        )
        // Return 200 OK to acknowledge receipt (even though we're not processing)
        return NextResponse.json({
          received: true,
          message: 'Duplicate webhook, already processed',
        })
      }

      // Set idempotency key with 30 second TTL
      // This prevents duplicate processing within the retry window
      await redis.setex(idempotencyKey, 30, 'processing')
      console.log(
        `[ShopifyWebhook] Idempotency key set for order ${payload.id}`
      )
    } catch (error) {
      console.error(`[ShopifyWebhook] Redis error during idempotency check:`, error)
      // Continue processing even if Redis fails (better to potentially duplicate than miss orders)
    }

    // Step 6: Queue the webhook for async processing
    try {
      const job = await shopifyWebhookQueue.add(
        'process-order',
        {
          payload,
          metadata,
          shopDomain: metadata.domain,
        },
        {
          // Job options
          jobId: `shopify-order-${payload.id}-${Date.now()}`, // Unique job ID
          removeOnComplete: {
            count: 1000,
            age: 7 * 24 * 3600, // 7 days
          },
          removeOnFail: {
            count: 1000,
            age: 30 * 24 * 3600, // 30 days
          },
        }
      )

      const processingTime = Date.now() - startTime
      console.log(
        `[ShopifyWebhook] Job queued: ${job.id} for order ${payload.id} (${processingTime}ms)`
      )

      // Step 7: Return 200 OK immediately (Shopify expects quick response)
      return NextResponse.json({
        received: true,
        jobId: job.id,
        orderId: payload.id,
        orderName: payload.name,
      })
    } catch (error: any) {
      console.error(`[ShopifyWebhook] Failed to queue job:`, error)

      // Clean up idempotency key if queueing fails
      try {
        await redis.del(idempotencyKey)
      } catch (redisError) {
        console.error(`[ShopifyWebhook] Failed to clean up idempotency key:`, redisError)
      }

      return NextResponse.json(
        { error: 'Failed to queue webhook for processing' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error(
      `[ShopifyWebhook] Unhandled error (${processingTime}ms):`,
      error
    )

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 * Can be used to verify the webhook endpoint is accessible
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'shopify-orders-webhook',
    timestamp: new Date().toISOString(),
  })
}