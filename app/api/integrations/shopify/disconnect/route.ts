import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireRole } from '@/lib/auth/middleware'
import { ShopifyClient } from '@/lib/shopify/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const disconnectSchema = z.object({
  shopDomain: z.string().min(1, 'Shop domain is required'),
})

/**
 * DELETE /api/integrations/shopify/disconnect
 * Disconnects a Shopify store by deleting the connection
 *
 * Body:
 * - shopDomain: The shop domain to disconnect
 */
export async function DELETE(request: NextRequest) {
  // Require DROPSHIPPER role
  const authResult = await requireRole(request, ['DROPSHIPPER'])
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    // Parse request body
    const body = await request.json()
    const validation = disconnectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.errors,
        },
        { status: 400 },
      )
    }

    const { shopDomain } = validation.data

    // Get dropshipper profile
    const dropshipperProfile = await prisma.dropshipperProfile.findFirst({
      where: {
        userId: user.userId,
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

    // Find the connection
    const connection = await prisma.shopifyConnection.findFirst({
      where: {
        dropshipperId: dropshipperProfile.id,
        shopDomain,
      },
    })

    if (!connection) {
      return NextResponse.json(
        {
          error: 'Connection not found',
          message: 'No Shopify connection found for this shop domain',
        },
        { status: 404 },
      )
    }

    // Try to delete webhooks from Shopify (best effort)
    try {
      const shopifyClient = new ShopifyClient(
        connection.shopDomain,
        connection.accessToken,
      )

      const webhooks = await shopifyClient.getWebhooks()
      for (const webhook of webhooks) {
        // Delete webhooks pointing to our app
        if (webhook.address.includes(process.env.NEXT_PUBLIC_APP_URL || '')) {
          await shopifyClient.deleteWebhook(webhook.id)
          console.log(
            `Deleted webhook ${webhook.id} for shop:`,
            connection.shopDomain,
          )
        }
      }
    } catch (webhookError) {
      console.error('Failed to delete webhooks:', webhookError)
      // Continue with disconnection even if webhook deletion fails
    }

    // Delete the connection from database
    await prisma.shopifyConnection.delete({
      where: {
        id: connection.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Shopify store disconnected successfully',
      shopDomain,
    })
  } catch (error) {
    console.error('Shopify disconnect error:', error)

    return NextResponse.json(
      {
        error: 'Failed to disconnect Shopify store',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  } finally {
    await prisma.$disconnect()
  }
}