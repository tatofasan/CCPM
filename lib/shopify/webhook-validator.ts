import crypto from 'crypto'
import { env } from '@/lib/env'

export class WebhookValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'WebhookValidationError'
  }
}

/**
 * Verify Shopify webhook HMAC signature
 *
 * Shopify signs all webhooks with HMAC-SHA256 using the webhook secret.
 * The signature is sent in the X-Shopify-Hmac-Sha256 header.
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  hmacHeader: string,
): boolean {
  const webhookSecret = env.SHOPIFY_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new WebhookValidationError('SHOPIFY_WEBHOOK_SECRET is not configured')
  }

  // Ensure body is a string
  const bodyString = typeof body === 'string' ? body : body.toString('utf8')

  // Generate HMAC using SHA256
  const generatedHmac = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyString, 'utf8')
    .digest('base64')

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHmac),
      Buffer.from(hmacHeader),
    )
  } catch (error) {
    // timingSafeEqual throws if buffers are different lengths
    return false
  }
}

/**
 * Verify webhook came from Shopify by checking shop domain
 */
export function verifyShopDomain(shopDomain: string): boolean {
  if (!shopDomain) {
    return false
  }

  // Check if domain ends with .myshopify.com
  const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
  return shopifyDomainRegex.test(shopDomain)
}

/**
 * Extract webhook metadata from headers
 */
export interface WebhookMetadata {
  topic: string
  domain: string
  webhookId: string
  apiVersion: string
}

export function extractWebhookMetadata(headers: Headers): WebhookMetadata {
  const topic = headers.get('X-Shopify-Topic')
  const domain = headers.get('X-Shopify-Shop-Domain')
  const webhookId = headers.get('X-Shopify-Webhook-Id')
  const apiVersion = headers.get('X-Shopify-API-Version')

  if (!topic || !domain || !webhookId) {
    throw new WebhookValidationError(
      'Missing required webhook headers (topic, domain, or webhook ID)',
    )
  }

  return {
    topic,
    domain,
    webhookId,
    apiVersion: apiVersion || 'unknown',
  }
}

/**
 * Validate complete webhook request
 */
export function validateWebhookRequest(
  body: string | Buffer,
  headers: Headers,
): WebhookMetadata {
  // Extract HMAC from header
  const hmacHeader = headers.get('X-Shopify-Hmac-Sha256')
  if (!hmacHeader) {
    throw new WebhookValidationError('Missing HMAC signature header')
  }

  // Verify HMAC signature
  if (!verifyWebhookSignature(body, hmacHeader)) {
    throw new WebhookValidationError('Invalid HMAC signature')
  }

  // Extract and validate metadata
  const metadata = extractWebhookMetadata(headers)

  // Verify shop domain format
  if (!verifyShopDomain(metadata.domain)) {
    throw new WebhookValidationError('Invalid shop domain')
  }

  return metadata
}