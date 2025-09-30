import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { generateAuthUrl, normalizeShopDomain, validateShopDomain } from '@/lib/shopify/oauth'
import { env } from '@/lib/env'
import { z } from 'zod'

const connectSchema = z.object({
  shop: z.string().min(1, 'Shop domain is required'),
})

/**
 * GET /api/integrations/shopify/connect
 * Initiates Shopify OAuth flow by redirecting to Shopify authorization page
 *
 * Query parameters:
 * - shop: The shop domain (e.g., "mystore.myshopify.com" or "mystore")
 */
export async function GET(request: NextRequest) {
  // Require DROPSHIPPER role
  const authResult = await requireRole(request, ['DROPSHIPPER'])
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')

    const validation = connectSchema.safeParse({ shop })
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    // Normalize shop domain
    const normalizedShop = normalizeShopDomain(validation.data.shop)

    // Validate shop domain format
    if (!validateShopDomain(normalizedShop)) {
      return NextResponse.json(
        {
          error: 'Invalid shop domain',
          message: 'Shop domain must be a valid Shopify store (e.g., mystore.myshopify.com)',
        },
        { status: 400 },
      )
    }

    // Generate callback URL
    const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const redirectUri = `${appUrl}/api/integrations/shopify/callback`

    // Generate state for CSRF protection (include user ID for verification)
    const state = Buffer.from(
      JSON.stringify({
        userId: user.userId,
        timestamp: Date.now(),
      }),
    ).toString('base64')

    // Generate Shopify OAuth URL
    const authUrl = generateAuthUrl(normalizedShop, redirectUri, state)

    // Return the auth URL for client-side redirect
    return NextResponse.json({
      success: true,
      authUrl,
      shop: normalizedShop,
    })
  } catch (error) {
    console.error('Shopify connect error:', error)

    return NextResponse.json(
      {
        error: 'Failed to initiate Shopify connection',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}