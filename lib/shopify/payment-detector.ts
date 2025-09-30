import { PaymentType } from '@prisma/client'
import { ShopifyOrder } from './client'

/**
 * Payment detection rules:
 * - TC (Credit Card): Any payment gateway that indicates electronic payment
 *   (credit card, debit card, online payment, etc.)
 * - COD (Cash on Delivery): Cash on delivery or manual payment methods
 */

const COD_INDICATORS = [
  'cash on delivery',
  'cod',
  'manual payment',
  'manual',
  'cash',
  'efectivo',
  'pago contra entrega',
]

const TC_GATEWAYS = [
  'shopify_payments',
  'stripe',
  'paypal',
  'mercado pago',
  'mercadopago',
  'credit card',
  'debit card',
  'tarjeta',
]

/**
 * Detect payment type from Shopify order
 *
 * Logic:
 * 1. Check payment_gateway_names for known payment methods
 * 2. If contains COD indicators → COD
 * 3. If contains known TC gateways → TC
 * 4. If financial_status is 'paid' and no COD indicators → TC
 * 5. Default to COD for safety (requires manual verification)
 *
 * @param shopifyOrder - The Shopify order object
 * @returns PaymentType - 'TC' or 'COD'
 */
export function detectPaymentType(shopifyOrder: ShopifyOrder): PaymentType {
  const paymentGateways = shopifyOrder.payment_gateway_names || []
  const financialStatus = shopifyOrder.financial_status?.toLowerCase() || ''

  // Normalize gateway names to lowercase for comparison
  const normalizedGateways = paymentGateways.map((gateway) =>
    gateway.toLowerCase().trim(),
  )

  // Check for COD indicators
  const isCOD = normalizedGateways.some((gateway) =>
    COD_INDICATORS.some((indicator) => gateway.includes(indicator)),
  )

  if (isCOD) {
    return PaymentType.COD
  }

  // Check for known TC payment gateways
  const isTC = normalizedGateways.some((gateway) =>
    TC_GATEWAYS.some((tcGateway) => gateway.includes(tcGateway)),
  )

  if (isTC) {
    return PaymentType.TC
  }

  // If financial status is paid and no explicit COD indicators, assume TC
  if (financialStatus === 'paid' || financialStatus === 'authorized') {
    return PaymentType.TC
  }

  // If no payment gateway is specified, check if it's pending payment
  if (
    normalizedGateways.length === 0 &&
    (financialStatus === 'pending' || financialStatus === 'unpaid')
  ) {
    return PaymentType.COD
  }

  // Default to COD for safety (requires manual review)
  return PaymentType.COD
}

/**
 * Get a human-readable description of the detected payment method
 *
 * @param shopifyOrder - The Shopify order object
 * @returns string - Description of the payment method
 */
export function getPaymentMethodDescription(
  shopifyOrder: ShopifyOrder,
): string {
  const paymentGateways = shopifyOrder.payment_gateway_names || []
  const paymentType = detectPaymentType(shopifyOrder)

  if (paymentGateways.length === 0) {
    return paymentType === PaymentType.COD
      ? 'Cash on Delivery (No gateway)'
      : 'Unknown payment method'
  }

  return `${paymentType} (${paymentGateways.join(', ')})`
}