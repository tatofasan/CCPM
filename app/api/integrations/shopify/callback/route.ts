import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {
  exchangeCodeForToken,
  verifyHmac,
  verifyTimestamp,
  ShopifyOAuthParams,
} from '@/lib/shopify/oauth'
import { ShopifyClient } from '@/lib/shopify/client'
import { env } from '@/lib/env'

const prisma = new PrismaClient()

/**
 * GET /api/integrations/shopify/callback
 * Handles OAuth callback from Shopify
 *
 * Query parameters:
 * - shop: Shop domain
 * - code: Authorization code
 * - hmac: HMAC signature for verification
 * - timestamp: Request timestamp
 * - state: CSRF token with user info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract OAuth parameters
    const shop = searchParams.get('shop')
    const code = searchParams.get('code')
    const hmac = searchParams.get('hmac')
    const timestamp = searchParams.get('timestamp')
    const state = searchParams.get('state')

    // Validate required parameters
    if (!shop || !code || !hmac || !timestamp) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          message: 'Shop, code, hmac, and timestamp are required',
        },
        { status: 400 },
      )
    }

    // Verify state parameter
    if (!state) {
      return NextResponse.json(
        {
          error: 'Missing state parameter',
          message: 'CSRF token is required',
        },
        { status: 400 },
      )
    }

    // Decode and validate state
    let stateData: { userId: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid state parameter',
          message: 'Could not decode CSRF token',
        },
        { status: 400 },
      )
    }

    // Verify state timestamp (prevent replay attacks - max 10 minutes)
    const stateAge = Date.now() - stateData.timestamp
    if (stateAge > 10 * 60 * 1000) {
      return NextResponse.json(
        {
          error: 'State expired',
          message: 'OAuth flow took too long, please try again',
        },
        { status: 400 },
      )
    }

    // Prepare params for HMAC verification
    const oauthParams: ShopifyOAuthParams = {
      shop,
      code,
      hmac,
      timestamp,
      state,
    }

    // Verify HMAC signature
    if (!verifyHmac(oauthParams)) {
      return NextResponse.json(
        {
          error: 'Invalid HMAC signature',
          message: 'Request verification failed',
        },
        { status: 401 },
      )
    }

    // Verify timestamp to prevent replay attacks
    if (!verifyTimestamp(timestamp)) {
      return NextResponse.json(
        {
          error: 'Invalid timestamp',
          message: 'Request is too old or from the future',
        },
        { status: 401 },
      )
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeCodeForToken(shop, code)

    // Get dropshipper profile
    const dropshipperProfile = await prisma.dropshipperProfile.findFirst({
      where: {
        userId: stateData.userId,
      },
    })

    if (!dropshipperProfile) {
      return NextResponse.json(
        {
          error: 'Dropshipper profile not found',
          message: 'Please complete your profile setup first',
        },
        { status: 404 },
      )
    }

    // Check if connection already exists
    const existingConnection = await prisma.shopifyConnection.findFirst({
      where: {
        dropshipperId: dropshipperProfile.id,
        shopDomain: shop,
      },
    })

    let connection
    if (existingConnection) {
      // Update existing connection
      connection = await prisma.shopifyConnection.update({
        where: {
          id: existingConnection.id,
        },
        data: {
          accessToken: tokenResponse.access_token,
          status: 'ACTIVE',
          updatedAt: new Date(),
        },
      })
    } else {
      // Create new connection
      connection = await prisma.shopifyConnection.create({
        data: {
          dropshipperId: dropshipperProfile.id,
          shopDomain: shop,
          accessToken: tokenResponse.access_token,
          status: 'ACTIVE',
        },
      })
    }

    // Initialize Shopify client
    const shopifyClient = new ShopifyClient(shop, tokenResponse.access_token)

    // Register webhook for orders/create
    try {
      const appUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const webhookUrl = `${appUrl}/api/webhooks/shopify/orders`

      // Check existing webhooks first
      const existingWebhooks = await shopifyClient.getWebhooks()
      const orderWebhook = existingWebhooks.find(
        (webhook) =>
          webhook.topic === 'orders/create' && webhook.address === webhookUrl,
      )

      if (!orderWebhook) {
        await shopifyClient.registerWebhook('orders/create', webhookUrl)
        console.log('Registered orders/create webhook for shop:', shop)
      } else {
        console.log('Webhook already exists for shop:', shop)
      }
    } catch (webhookError) {
      console.error('Failed to register webhook:', webhookError)
      // Don't fail the connection, just log the error
    }

    // Redirect to success page
    const redirectUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?shopify=connected&shop=${encodeURIComponent(shop)}`
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Shopify callback error:', error)

    const redirectUrl = `${env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?shopify=error&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    return NextResponse.redirect(redirectUrl)
  } finally {
    await prisma.$disconnect()
  }
}