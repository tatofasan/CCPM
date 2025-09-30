import { Job } from 'bullmq'
import { prisma } from '@/lib/prisma'
import {
  mapShopifyOrderToDatabase,
  validateShopifyOrder,
} from '@/lib/shopify/order-mapper'
import { ShopifyOrder } from '@/lib/shopify/client'
import { getRedisClient } from '@/lib/auth/redis'
import { WebhookMetadata } from '@/lib/shopify/webhook-validator'

/**
 * Shopify webhook job data structure
 */
export interface ShopifyWebhookJobData {
  payload: ShopifyOrder
  metadata: WebhookMetadata
  shopDomain: string
}

/**
 * Process Shopify webhook job
 *
 * This function:
 * 1. Finds the Shopify connection by shop domain
 * 2. Validates the order can be processed
 * 3. Maps the Shopify order payload to database schema (using Stream C mapper)
 * 4. Creates the order and order items in the database
 * 5. Updates the connection's last_sync_at timestamp
 * 6. Creates a notification for the dropshipper
 *
 * @param job - BullMQ job containing webhook data
 * @returns Result object with success status
 */
export async function processShopifyWebhookJob(
  job: Job<ShopifyWebhookJobData>
) {
  const { payload, metadata, shopDomain } = job.data

  console.log(
    `[ShopifyWebhook] Processing job ${job.id}: Order ${payload.id} from ${shopDomain}`
  )

  try {
    // Step 1: Find the Shopify connection
    console.log(`[ShopifyWebhook] Finding connection for shop: ${shopDomain}`)
    const connection = await prisma.shopifyConnection.findFirst({
      where: {
        shopDomain: shopDomain,
        status: 'ACTIVE',
      },
      include: {
        dropshipper: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!connection) {
      throw new Error(`No active Shopify connection found for ${shopDomain}`)
    }

    console.log(
      `[ShopifyWebhook] Found connection for dropshipper: ${connection.dropshipper.user.email}`
    )

    // Step 2: Check if order already exists (idempotency at database level)
    const existingOrder = await prisma.order.findUnique({
      where: {
        shopifyOrderId: payload.id.toString(),
      },
    })

    if (existingOrder) {
      console.log(
        `[ShopifyWebhook] Order ${payload.id} already exists in database, skipping`
      )
      return {
        success: true,
        orderId: existingOrder.id,
        message: 'Order already exists (duplicate webhook)',
      }
    }

    // Step 3: Validate Shopify order
    console.log(`[ShopifyWebhook] Validating order structure`)
    const validation = validateShopifyOrder(payload)
    if (!validation.isValid) {
      const errorMessage = `Invalid Shopify order: ${validation.errors.join(', ')}`
      console.error(`[ShopifyWebhook] ${errorMessage}`)
      throw new Error(errorMessage)
    }

    // Step 4: Map Shopify order to database format (using Stream C mapper)
    console.log(`[ShopifyWebhook] Mapping order data using Stream C mapper`)
    const mappingResult = await mapShopifyOrderToDatabase(
      payload,
      connection.id, // connectionId
      connection.dropshipperId, // dropshipperId
      {
        strictProductMatching: false, // Allow missing products (log warnings)
        strictAddressValidation: false, // Allow incomplete addresses (log warnings)
      }
    )

    const { order, warnings, errors } = mappingResult

    // Log warnings and errors
    if (warnings.length > 0) {
      console.warn(
        `[ShopifyWebhook] Order mapping warnings for ${payload.id}:`,
        warnings
      )
    }

    if (errors.length > 0) {
      console.error(
        `[ShopifyWebhook] Order mapping errors for ${payload.id}:`,
        errors
      )
      // Continue processing even with errors (partial order creation)
      // Manual intervention may be required
    }

    // Step 5: Create order and order items in a transaction
    console.log(`[ShopifyWebhook] Creating order in database`)
    const createdOrder = await prisma.$transaction(async tx => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          dropshipperId: order.dropshipperId,
          shopifyOrderId: order.shopifyOrderId,
          storeId: order.storeId,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          shippingAddress: order.shippingAddress,
          paymentType: order.paymentType,
          state: order.state,
          totalAmount: order.totalAmount,
          productCost: order.productCost,
          shippingCost: order.shippingCost,
          commissionAmount: order.commissionAmount,
        },
      })

      // Create order items
      if (order.items.length > 0) {
        await tx.orderItem.createMany({
          data: order.items.map(item => ({
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        })
      }

      // Create order event
      await tx.orderEvent.create({
        data: {
          orderId: newOrder.id,
          fromState: null,
          toState: order.state,
          changedByUserId: connection.dropshipper.userId,
          reason: 'Order created from Shopify webhook',
          metadata: {
            shopifyOrderId: payload.id,
            shopifyOrderName: payload.name,
            webhookId: metadata.webhookId,
            topic: metadata.topic,
            warnings: warnings,
            errors: errors,
          },
        },
      })

      return newOrder
    })

    console.log(`[ShopifyWebhook] Order created successfully: ${createdOrder.id}`)

    // Step 6: Update connection's last_sync_at
    await prisma.shopifyConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    })

    // Step 7: Create notification for dropshipper
    await prisma.notification.create({
      data: {
        userId: connection.dropshipper.userId,
        type: 'NEW_ORDER',
        title: 'New Order from Shopify',
        message: `Order ${payload.name} for ${order.customerName} has been imported from your Shopify store.`,
        metadata: {
          orderId: createdOrder.id,
          shopifyOrderId: payload.id,
          shopifyOrderName: payload.name,
          totalAmount: Number(order.totalAmount),
          warnings: warnings.length > 0 ? warnings : undefined,
          errors: errors.length > 0 ? errors : undefined,
        },
      },
    })

    console.log(
      `[ShopifyWebhook] Job ${job.id} completed successfully. Order ID: ${createdOrder.id}`
    )

    return {
      success: true,
      orderId: createdOrder.id,
      shopifyOrderId: payload.id,
      shopifyOrderName: payload.name,
      warnings: warnings,
      errors: errors,
    }
  } catch (error: any) {
    console.error(`[ShopifyWebhook] Job ${job.id} failed:`, error)

    // Log error details
    const errorMessage = error.message || 'Unknown error'
    console.error(`[ShopifyWebhook] Error details: ${errorMessage}`)

    // Update connection status to ERROR if this is a persistent issue
    // Only do this after multiple failures to avoid false positives
    if (job.attemptsMade >= 2) {
      console.error(
        `[ShopifyWebhook] Multiple failures detected, marking connection as ERROR`
      )
      try {
        await prisma.shopifyConnection.updateMany({
          where: {
            shopDomain: shopDomain,
          },
          data: {
            status: 'ERROR',
          },
        })
      } catch (updateError) {
        console.error(
          `[ShopifyWebhook] Failed to update connection status:`,
          updateError
        )
      }
    }

    // Throw error to trigger BullMQ retry logic
    throw new Error(`Shopify webhook processing failed: ${errorMessage}`)
  }
}

/**
 * Handle webhook job failure (after all retries)
 *
 * @param job - Failed job
 * @param error - Error that caused the failure
 */
export async function handleShopifyWebhookJobFailure(
  job: Job<ShopifyWebhookJobData>,
  error: Error
) {
  const { payload, shopDomain } = job.data

  console.error(
    `[ShopifyWebhook] Job ${job.id} failed permanently after all retries`
  )
  console.error(`[ShopifyWebhook] Shop Domain: ${shopDomain}`)
  console.error(`[ShopifyWebhook] Shopify Order ID: ${payload.id}`)
  console.error(`[ShopifyWebhook] Order Name: ${payload.name}`)
  console.error(`[ShopifyWebhook] Error: ${error.message}`)

  // Create admin notification about the failure
  try {
    // Find all admin users
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
    })

    // Create notifications for all admins
    await Promise.all(
      adminUsers.map(admin =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'WEBHOOK_FAILURE',
            title: 'Shopify Webhook Processing Failed',
            message: `Failed to process order ${payload.name} from ${shopDomain} after all retries. Manual intervention required.`,
            metadata: {
              jobId: job.id,
              shopifyOrderId: payload.id,
              shopifyOrderName: payload.name,
              shopDomain: shopDomain,
              error: error.message,
              attemptsMode: job.attemptsMade,
              payload: payload,
            },
          },
        })
      )
    )

    console.log(`[ShopifyWebhook] Admin notifications created for job ${job.id}`)
  } catch (notificationError) {
    console.error(
      `[ShopifyWebhook] Failed to create admin notifications:`,
      notificationError
    )
  }
}

/**
 * Handle webhook job completion
 *
 * @param job - Completed job
 * @param result - Result from the job processor
 */
export async function handleShopifyWebhookJobComplete(
  job: Job<ShopifyWebhookJobData>,
  result: {
    success: boolean
    orderId?: string
    shopifyOrderId?: number
    message?: string
    warnings?: string[]
    errors?: string[]
  }
) {
  console.log(`[ShopifyWebhook] Job ${job.id} completed`)
  console.log(`[ShopifyWebhook] Order ID: ${result.orderId}`)
  console.log(`[ShopifyWebhook] Shopify Order ID: ${result.shopifyOrderId}`)
  console.log(`[ShopifyWebhook] Message: ${result.message || 'Success'}`)

  if (result.warnings && result.warnings.length > 0) {
    console.warn(
      `[ShopifyWebhook] Job ${job.id} completed with warnings:`,
      result.warnings
    )
  }

  if (result.errors && result.errors.length > 0) {
    console.error(
      `[ShopifyWebhook] Job ${job.id} completed with errors:`,
      result.errors
    )
  }

  // TODO: Log to analytics/monitoring
  // - Track webhook processing time
  // - Monitor success/failure rates
  // - Alert on unusual patterns
  // - Track orders with warnings/errors for manual review
}