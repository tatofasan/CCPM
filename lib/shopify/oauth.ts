import crypto from 'crypto'
import { env } from '@/lib/env'

export interface ShopifyOAuthParams {
  shop: string
  code: string
  hmac: string
  timestamp: string
  state?: string
}

export interface ShopifyAccessTokenResponse {
  access_token: string
  scope: string
}

export class ShopifyOAuthError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message)
    this.name = 'ShopifyOAuthError'
  }
}

/**
 * Shopify OAuth Scopes required for the application
 */
export const SHOPIFY_SCOPES = [
  'read_orders',
  'write_orders',
  'read_products',
] as const

export type ShopifyScope = (typeof SHOPIFY_SCOPES)[number]

/**
 * Generate the OAuth authorization URL for Shopify
 */
export function generateAuthUrl(
  shopDomain: string,
  redirectUri: string,
  state?: string,
): string {
  const clientId = env.SHOPIFY_CLIENT_ID
  if (!clientId) {
    throw new ShopifyOAuthError(
      'SHOPIFY_CLIENT_ID is not configured',
      'MISSING_CLIENT_ID',
    )
  }

  const scopes = SHOPIFY_SCOPES.join(',')
  const nonce = state || generateNonce()

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
    state: nonce,
  })

  return `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`
}

/**
 * Generate a random nonce for CSRF protection
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex')
}

/**
 * Verify the HMAC signature from Shopify OAuth callback
 */
export function verifyHmac(params: ShopifyOAuthParams): boolean {
  const clientSecret = env.SHOPIFY_CLIENT_SECRET
  if (!clientSecret) {
    throw new ShopifyOAuthError(
      'SHOPIFY_CLIENT_SECRET is not configured',
      'MISSING_CLIENT_SECRET',
    )
  }

  const { hmac, ...rest } = params

  // Sort parameters alphabetically and create query string
  const message = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key as keyof typeof rest]}`)
    .join('&')

  // Generate HMAC using SHA256
  const generatedHmac = crypto
    .createHmac('sha256', clientSecret)
    .update(message)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(generatedHmac),
  )
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  shopDomain: string,
  code: string,
): Promise<ShopifyAccessTokenResponse> {
  const clientId = env.SHOPIFY_CLIENT_ID
  const clientSecret = env.SHOPIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new ShopifyOAuthError(
      'Shopify credentials are not configured',
      'MISSING_CREDENTIALS',
    )
  }

  const url = `https://${shopDomain}/admin/oauth/access_token`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ShopifyOAuthError(
        errorData.error_description ||
          `Failed to exchange code for token: ${response.statusText}`,
        'TOKEN_EXCHANGE_FAILED',
      )
    }

    const data = await response.json()
    return data as ShopifyAccessTokenResponse
  } catch (error) {
    if (error instanceof ShopifyOAuthError) {
      throw error
    }
    throw new ShopifyOAuthError(
      `Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'TOKEN_EXCHANGE_ERROR',
    )
  }
}

/**
 * Validate shop domain format
 */
export function validateShopDomain(domain: string): boolean {
  if (!domain) {
    return false
  }

  // Remove protocol and trailing slash if present
  domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')

  // Check if domain is a valid myshopify.com domain
  const shopifyDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/
  return shopifyDomainRegex.test(domain)
}

/**
 * Normalize shop domain to myshopify.com format
 */
export function normalizeShopDomain(domain: string): string {
  // Remove protocol if present
  domain = domain.replace(/^https?:\/\//, '')

  // Remove trailing slash
  domain = domain.replace(/\/$/, '')

  // Add .myshopify.com if not present
  if (!domain.endsWith('.myshopify.com')) {
    domain = `${domain}.myshopify.com`
  }

  return domain
}

/**
 * Verify timestamp to prevent replay attacks
 * Shopify recommends rejecting requests older than 1 hour
 */
export function verifyTimestamp(timestamp: string, maxAgeSeconds = 3600): boolean {
  const timestampMs = parseInt(timestamp, 10) * 1000
  const now = Date.now()
  const age = now - timestampMs

  return age >= 0 && age <= maxAgeSeconds * 1000
}