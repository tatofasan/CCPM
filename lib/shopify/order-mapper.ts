import { Prisma, OrderState } from '@prisma/client'
import { ShopifyOrder } from './client'
import { detectPaymentType } from './payment-detector'
import { parseShippingAddress, validateAddress } from './address-parser'
import { prisma } from '@/lib/prisma'

/**
 * Mapped order data ready for Prisma create
 */
export interface MappedOrder {
  dropshipperId: string
  shopifyOrderId: string
  storeId: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  shippingAddress: Prisma.JsonValue
  paymentType: 'TC' | 'COD'
  state: OrderState
  totalAmount: Prisma.Decimal
  productCost: Prisma.Decimal
  shippingCost: Prisma.Decimal
  commissionAmount: Prisma.Decimal
  items: MappedOrderItem[]
}

/**
 * Mapped order item
 */
export interface MappedOrderItem {
  productId: string
  quantity: number
  unitPrice: Prisma.Decimal
  subtotal: Prisma.Decimal
  shopifyLineItemId: number
  shopifyProductId: number
  shopifyVariantId: number
  title: string
  sku: string
}

/**
 * Order mapping options
 */
export interface OrderMappingOptions {
  /**
   * If true, throws error when product is not found by SKU
   * If false, continues with warning (requires manual product matching)
   */
  strictProductMatching?: boolean

  /**
   * If true, throws error when address is invalid
   * If false, continues with warning
   */
  strictAddressValidation?: boolean
}

/**
 * Order mapping result with warnings
 */
export interface OrderMappingResult {
  order: MappedOrder
  warnings: string[]
  errors: string[]
}

/**
 * Map Shopify order to database schema
 *
 * This is the main entry point for converting Shopify orders to our database format
 *
 * @param shopifyOrder - The Shopify order from webhook
 * @param connectionId - The shopify_connections.id
 * @param dropshipperId - The dropshipper_profiles.id
 * @param options - Mapping options for strictness
 * @returns MappedOrder - Order data ready for Prisma
 */
export async function mapShopifyOrderToDatabase(
  shopifyOrder: ShopifyOrder,
  connectionId: string,
  dropshipperId: string,
  options: OrderMappingOptions = {},
): Promise<OrderMappingResult> {
  const warnings: string[] = []
  const errors: string[] = []

  try {
    // 1. Parse and validate shipping address
    const shippingAddress = parseShippingAddress(shopifyOrder)
    const addressValidation = validateAddress(shippingAddress)

    if (!addressValidation.isValid) {
      const errorMsg = `Invalid address: missing ${addressValidation.missingFields.join(', ')}`
      if (options.strictAddressValidation) {
        throw new Error(errorMsg)
      }
      errors.push(errorMsg)
    }

    if (addressValidation.warnings.length > 0) {
      warnings.push(...addressValidation.warnings)
    }

    // 2. Detect payment type
    const paymentType = detectPaymentType(shopifyOrder)

    // 3. Extract customer information
    const customerName = getCustomerName(shopifyOrder)
    const customerEmail = shopifyOrder.customer?.email || shopifyOrder.email || null
    const customerPhone = shopifyOrder.shipping_address?.phone || null

    // 4. Get dropshipper commission rate
    const dropshipperProfile = await prisma.dropshipperProfile.findUnique({
      where: { id: dropshipperId },
      select: { commissionRate: true },
    })

    if (!dropshipperProfile) {
      throw new Error(`Dropshipper profile not found: ${dropshipperId}`)
    }

    const commissionRate = Number(dropshipperProfile.commissionRate)

    // 5. Map line items and calculate costs
    const { items, itemsWarnings, itemsErrors } = await mapLineItems(
      shopifyOrder,
      options.strictProductMatching,
    )

    warnings.push(...itemsWarnings)
    errors.push(...itemsErrors)

    // 6. Calculate order amounts
    const productCost = items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    )

    const shippingCost = parseFloat(
      shopifyOrder.total_shipping_price_set?.shop_money?.amount || '0',
    )

    const totalAmount = parseFloat(shopifyOrder.total_price)

    const commissionAmount = productCost * commissionRate

    // 7. Build mapped order object
    const mappedOrder: MappedOrder = {
      dropshipperId,
      shopifyOrderId: shopifyOrder.id.toString(),
      storeId: connectionId,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress: shippingAddress as Prisma.JsonValue,
      paymentType,
      state: OrderState.PENDING,
      totalAmount: new Prisma.Decimal(totalAmount),
      productCost: new Prisma.Decimal(productCost),
      shippingCost: new Prisma.Decimal(shippingCost),
      commissionAmount: new Prisma.Decimal(commissionAmount),
      items,
    }

    return {
      order: mappedOrder,
      warnings,
      errors,
    }
  } catch (error) {
    throw new Error(
      `Failed to map Shopify order ${shopifyOrder.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}

/**
 * Map Shopify line items to order items
 *
 * Attempts to match products by SKU in database
 *
 * @param shopifyOrder - The Shopify order
 * @param strictMatching - If true, throws error when product not found
 * @returns Array of mapped order items with warnings
 */
async function mapLineItems(
  shopifyOrder: ShopifyOrder,
  strictMatching: boolean = false,
): Promise<{
  items: MappedOrderItem[]
  itemsWarnings: string[]
  itemsErrors: string[]
}> {
  const items: MappedOrderItem[] = []
  const itemsWarnings: string[] = []
  const itemsErrors: string[] = []

  for (const lineItem of shopifyOrder.line_items) {
    try {
      // Try to find product by SKU
      const product = await prisma.product.findUnique({
        where: { sku: lineItem.sku },
        select: { id: true, name: true, sku: true },
      })

      if (!product) {
        const errorMsg = `Product not found for SKU: ${lineItem.sku} (${lineItem.title})`

        if (strictMatching) {
          throw new Error(errorMsg)
        }

        itemsErrors.push(errorMsg)
        // Create a placeholder - manual matching will be required
        // For now, we'll skip this item and log error
        continue
      }

      const unitPrice = parseFloat(lineItem.price)
      const quantity = lineItem.quantity
      const subtotal = unitPrice * quantity

      items.push({
        productId: product.id,
        quantity,
        unitPrice: new Prisma.Decimal(unitPrice),
        subtotal: new Prisma.Decimal(subtotal),
        shopifyLineItemId: lineItem.id,
        shopifyProductId: lineItem.product_id,
        shopifyVariantId: lineItem.variant_id,
        title: lineItem.title,
        sku: lineItem.sku,
      })
    } catch (error) {
      const errorMsg = `Failed to map line item ${lineItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      itemsErrors.push(errorMsg)

      if (strictMatching) {
        throw error
      }
    }
  }

  if (items.length === 0) {
    throw new Error('No valid line items could be mapped from Shopify order')
  }

  return { items, itemsWarnings, itemsErrors }
}

/**
 * Get customer full name from Shopify order
 *
 * @param shopifyOrder - The Shopify order
 * @returns string - Customer full name
 */
function getCustomerName(shopifyOrder: ShopifyOrder): string {
  // Try customer object first
  if (shopifyOrder.customer) {
    const firstName = shopifyOrder.customer.first_name || ''
    const lastName = shopifyOrder.customer.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim()
    if (fullName) return fullName
  }

  // Try shipping address as fallback
  if (shopifyOrder.shipping_address) {
    const firstName = shopifyOrder.shipping_address.first_name || ''
    const lastName = shopifyOrder.shipping_address.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim()
    if (fullName) return fullName
  }

  // Last resort: use order name or email
  return shopifyOrder.name || shopifyOrder.email || 'Unknown Customer'
}

/**
 * Create order in database with all mapped data
 *
 * This is a convenience function that combines mapping and database creation
 *
 * @param shopifyOrder - The Shopify order
 * @param connectionId - The shopify_connections.id
 * @param dropshipperId - The dropshipper_profiles.id
 * @param options - Mapping options
 * @returns Created order with items
 */
export async function createOrderFromShopify(
  shopifyOrder: ShopifyOrder,
  connectionId: string,
  dropshipperId: string,
  options: OrderMappingOptions = {},
) {
  const mappingResult = await mapShopifyOrderToDatabase(
    shopifyOrder,
    connectionId,
    dropshipperId,
    options,
  )

  const { order, warnings, errors } = mappingResult

  // Log warnings and errors
  if (warnings.length > 0) {
    console.warn(
      `Order mapping warnings for ${shopifyOrder.id}:`,
      warnings,
    )
  }

  if (errors.length > 0) {
    console.error(
      `Order mapping errors for ${shopifyOrder.id}:`,
      errors,
    )
  }

  // Create order with items in a transaction
  const createdOrder = await prisma.order.create({
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
      items: {
        create: order.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  return {
    order: createdOrder,
    warnings,
    errors,
  }
}

/**
 * Validate that an order can be processed
 *
 * @param shopifyOrder - The Shopify order
 * @returns Object with isValid flag and error messages
 */
export function validateShopifyOrder(shopifyOrder: ShopifyOrder): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check required fields
  if (!shopifyOrder.id) errors.push('Order ID is missing')
  if (!shopifyOrder.line_items || shopifyOrder.line_items.length === 0) {
    errors.push('Order has no line items')
  }
  if (!shopifyOrder.total_price) errors.push('Total price is missing')
  if (!shopifyOrder.shipping_address) errors.push('Shipping address is missing')

  // Validate line items
  if (shopifyOrder.line_items) {
    shopifyOrder.line_items.forEach((item, index) => {
      if (!item.sku) {
        errors.push(`Line item ${index + 1} is missing SKU`)
      }
      if (!item.price) {
        errors.push(`Line item ${index + 1} is missing price`)
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Line item ${index + 1} has invalid quantity`)
      }
    })
  }

  // Validate amounts
  const totalPrice = parseFloat(shopifyOrder.total_price)
  if (isNaN(totalPrice) || totalPrice < 0) {
    errors.push('Invalid total price')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}