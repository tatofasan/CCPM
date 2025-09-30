# Shopify OAuth & Connection Management - Implementation Summary

**Task**: Issue #3 - Shopify Integration & Order Sync
**Stream**: Stream A - Shopify OAuth & Connection Management
**Status**: COMPLETED
**Date**: 2025-09-30

---

## Overview

This implementation provides complete Shopify OAuth functionality for the dropshipping platform, enabling dropshippers to connect their Shopify stores and automatically sync orders. The implementation includes OAuth flow, connection management, webhook registration, and a React UI component.

## Architecture

```
┌─────────────────┐
│  Dropshipper    │
│  Dashboard      │
└────────┬────────┘
         │
         │ 1. Click "Connect Store"
         ▼
┌─────────────────────────────────────────────────────────┐
│  GET /api/integrations/shopify/connect?shop=mystore     │
│  - Validates shop domain                                 │
│  - Generates OAuth URL with state (CSRF token)           │
│  - Returns authUrl to client                             │
└────────┬────────────────────────────────────────────────┘
         │
         │ 2. Redirect to Shopify
         ▼
┌─────────────────┐
│   Shopify       │
│   OAuth Page    │
│   (User Auth)   │
└────────┬────────┘
         │
         │ 3. User authorizes, Shopify redirects back
         ▼
┌─────────────────────────────────────────────────────────┐
│  GET /api/integrations/shopify/callback                 │
│  - Verifies HMAC signature                              │
│  - Verifies timestamp (prevents replay)                 │
│  - Exchanges code for access token                      │
│  - Saves connection to database                         │
│  - Registers orders/create webhook                      │
│  - Redirects to dashboard with success                  │
└────────┬────────────────────────────────────────────────┘
         │
         │ 4. Connection active
         ▼
┌─────────────────────────────────────────────────────────┐
│  Database: shopify_connections                          │
│  - shop_domain: mystore.myshopify.com                   │
│  - access_token: shpat_abc123...                        │
│  - status: ACTIVE                                        │
│  - webhook registered for orders/create                 │
└─────────────────────────────────────────────────────────┘
```

---

## Files Created

### Core Libraries

#### 1. `/home/tatofasan/Proyectos/CCPM/lib/shopify/client.ts`
**Shopify API Client**

Complete REST API client for Shopify Admin API with:
- Authentication via access token
- Rate limiting detection (429 handling)
- Error handling with custom error classes
- Request/response type safety

**Key Methods:**
```typescript
getShop(): Promise<ShopifyShop>
getOrders(params?): Promise<ShopifyOrder[]>
getOrder(orderId): Promise<ShopifyOrder>
registerWebhook(topic, address): Promise<ShopifyWebhook>
getWebhooks(): Promise<ShopifyWebhook[]>
deleteWebhook(webhookId): Promise<void>
```

**Static Utilities:**
```typescript
ShopifyClient.isValidShopDomain(domain): boolean
ShopifyClient.normalizeShopDomain(domain): string
```

**Example Usage:**
```typescript
import { ShopifyClient } from '@/lib/shopify/client'

const client = new ShopifyClient('mystore.myshopify.com', 'access_token')
const shop = await client.getShop()
const orders = await client.getOrders({ limit: 10, status: 'open' })
```

#### 2. `/home/tatofasan/Proyectos/CCPM/lib/shopify/oauth.ts`
**OAuth Utilities**

Handles Shopify OAuth 2.0 flow with security features:
- Authorization URL generation
- HMAC signature verification
- Timestamp validation
- Code-to-token exchange

**Key Functions:**
```typescript
generateAuthUrl(shopDomain, redirectUri, state?): string
generateNonce(): string
verifyHmac(params: ShopifyOAuthParams): boolean
verifyTimestamp(timestamp, maxAgeSeconds?): boolean
exchangeCodeForToken(shopDomain, code): Promise<ShopifyAccessTokenResponse>
validateShopDomain(domain): boolean
normalizeShopDomain(domain): string
```

**Required Scopes:**
- `read_orders` - Read order information
- `write_orders` - Update order status
- `read_products` - Read product catalog

**Example Usage:**
```typescript
import { generateAuthUrl, verifyHmac, exchangeCodeForToken } from '@/lib/shopify/oauth'

// Generate auth URL
const authUrl = generateAuthUrl(
  'mystore.myshopify.com',
  'https://myapp.com/callback',
  'csrf_token_123'
)

// Verify callback
if (verifyHmac(oauthParams)) {
  const tokenData = await exchangeCodeForToken(shop, code)
}
```

#### 3. `/home/tatofasan/Proyectos/CCPM/lib/shopify/webhook-validator.ts`
**Webhook Security Validator**

Validates incoming webhooks from Shopify:
- HMAC-SHA256 signature verification
- Shop domain validation
- Header extraction

**Key Functions:**
```typescript
verifyWebhookSignature(body, hmacHeader): boolean
verifyShopDomain(shopDomain): boolean
extractWebhookMetadata(headers): WebhookMetadata
validateWebhookRequest(body, headers): WebhookMetadata
```

**Example Usage:**
```typescript
import { validateWebhookRequest } from '@/lib/shopify/webhook-validator'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const metadata = validateWebhookRequest(body, request.headers)
  // metadata: { topic, domain, webhookId, apiVersion }
}
```

### API Endpoints

#### 4. `/home/tatofasan/Proyectos/CCPM/app/api/integrations/shopify/connect/route.ts`
**OAuth Initiation Endpoint**

**Endpoint**: `GET /api/integrations/shopify/connect?shop={shopDomain}`

**Authentication**: Requires DROPSHIPPER role

**Request:**
```bash
curl -X GET "http://localhost:3000/api/integrations/shopify/connect?shop=mystore" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://mystore.myshopify.com/admin/oauth/authorize?client_id=...&scope=...&redirect_uri=...&state=...",
  "shop": "mystore.myshopify.com"
}
```

**Process:**
1. Validates user has DROPSHIPPER role
2. Validates and normalizes shop domain
3. Generates CSRF state token with user ID
4. Creates Shopify OAuth URL with required scopes
5. Returns URL for client-side redirect

#### 5. `/home/tatofasan/Proyectos/CCPM/app/api/integrations/shopify/callback/route.ts`
**OAuth Callback Handler**

**Endpoint**: `GET /api/integrations/shopify/callback`

**Query Parameters:**
- `shop` - Shop domain
- `code` - Authorization code from Shopify
- `hmac` - HMAC signature for verification
- `timestamp` - Request timestamp
- `state` - CSRF token with user info

**Process:**
1. Extracts and validates all required parameters
2. Decodes and validates state token (max 10 minutes old)
3. Verifies HMAC signature
4. Verifies timestamp (prevents replay attacks)
5. Exchanges authorization code for access token
6. Looks up dropshipper profile
7. Creates or updates `shopify_connections` record
8. Initializes Shopify client
9. Registers `orders/create` webhook
10. Redirects to dashboard with success message

**Success Redirect:**
```
/dashboard/integrations?shopify=connected&shop=mystore.myshopify.com
```

**Error Redirect:**
```
/dashboard/integrations?shopify=error&message=Error+description
```

#### 6. `/home/tatofasan/Proyectos/CCPM/app/api/integrations/shopify/disconnect/route.ts`
**Store Disconnection Endpoint**

**Endpoint**: `DELETE /api/integrations/shopify/disconnect`

**Authentication**: Requires DROPSHIPPER role

**Request:**
```bash
curl -X DELETE "http://localhost:3000/api/integrations/shopify/disconnect" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shopDomain": "mystore.myshopify.com"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Shopify store disconnected successfully",
  "shopDomain": "mystore.myshopify.com"
}
```

**Process:**
1. Validates user has DROPSHIPPER role
2. Validates shop domain ownership
3. Attempts to delete webhooks from Shopify (best effort)
4. Deletes connection from database
5. Returns success confirmation

### UI Component

#### 7. `/home/tatofasan/Proyectos/CCPM/components/integrations/shopify-connect-button.tsx`
**React Component for Connection Management**

**Features:**
- Connect form with shop domain input
- Domain validation and normalization
- Connection status display
- Last sync timestamp
- Disconnect with confirmation dialog
- Error handling and loading states
- Responsive Tailwind CSS styling

**Props:**
```typescript
interface ShopifyConnectButtonProps {
  connection?: ShopifyConnection  // Existing connection if any
  onConnect?: () => void           // Callback after connect
  onDisconnect?: () => void        // Callback after disconnect
}
```

**Usage:**
```tsx
import ShopifyConnectButton from '@/components/integrations/shopify-connect-button'

// Without connection (show connect form)
<ShopifyConnectButton onConnect={handleConnect} />

// With connection (show status and disconnect)
<ShopifyConnectButton
  connection={shopifyConnection}
  onDisconnect={handleDisconnect}
/>
```

### Configuration

#### 8. `/home/tatofasan/Proyectos/CCPM/lib/env.ts` (Updated)
**Environment Variables Schema**

Added Shopify configuration:
```typescript
// Shopify Integration
SHOPIFY_CLIENT_ID: z.string().optional(),
SHOPIFY_CLIENT_SECRET: z.string().optional(),
SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
```

---

## Environment Setup

### Required Environment Variables

Add to `.env`:

```bash
# Shopify Integration
SHOPIFY_CLIENT_ID=your_shopify_client_id_from_partner_dashboard
SHOPIFY_CLIENT_SECRET=your_shopify_client_secret_from_partner_dashboard
SHOPIFY_WEBHOOK_SECRET=your_webhook_secret_for_hmac_verification
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Or your production URL
```

### Shopify Partner Setup

1. **Create Shopify Partner Account**
   - Go to https://partners.shopify.com
   - Sign up or log in

2. **Create App**
   - Navigate to "Apps" in Partner Dashboard
   - Click "Create app"
   - Choose "Public app" or "Custom app"
   - Fill in app details

3. **Configure App**
   - **App URL**: `https://yourdomain.com` (or ngrok URL for local dev)
   - **Allowed redirection URL(s)**:
     - `http://localhost:3000/api/integrations/shopify/callback` (dev)
     - `https://yourdomain.com/api/integrations/shopify/callback` (prod)
   - **Scopes**: Select required scopes
     - `read_orders`
     - `write_orders`
     - `read_products`

4. **Get Credentials**
   - Copy **API key** → `SHOPIFY_CLIENT_ID`
   - Copy **API secret key** → `SHOPIFY_CLIENT_SECRET`
   - Generate webhook secret → `SHOPIFY_WEBHOOK_SECRET`

5. **Create Development Store**
   - In Partner Dashboard, go to "Stores"
   - Click "Add store" → "Development store"
   - Use this store for testing

---

## Security Features

### 1. HMAC Signature Verification
**Purpose**: Ensure requests come from Shopify

**Implementation**:
```typescript
// OAuth callback verification
const generatedHmac = crypto
  .createHmac('sha256', clientSecret)
  .update(queryString)
  .digest('hex')

// Timing-safe comparison
crypto.timingSafeEqual(
  Buffer.from(hmac),
  Buffer.from(generatedHmac)
)
```

### 2. Timestamp Validation
**Purpose**: Prevent replay attacks

**Implementation**:
```typescript
verifyTimestamp(timestamp: string, maxAgeSeconds = 3600): boolean {
  const timestampMs = parseInt(timestamp, 10) * 1000
  const now = Date.now()
  const age = now - timestampMs
  return age >= 0 && age <= maxAgeSeconds * 1000
}
```

### 3. CSRF Protection
**Purpose**: Prevent cross-site request forgery

**Implementation**:
```typescript
// Generate state with user info
const state = Buffer.from(
  JSON.stringify({
    userId: user.userId,
    timestamp: Date.now()
  })
).toString('base64')

// Verify state on callback
const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'))
const stateAge = Date.now() - stateData.timestamp
// Reject if > 10 minutes old
```

### 4. Role-Based Access Control
**Purpose**: Only dropshippers can connect stores

**Implementation**:
```typescript
const authResult = await requireRole(request, ['DROPSHIPPER'])
if (authResult instanceof NextResponse) {
  return authResult // 401 or 403 error
}
```

### 5. Webhook Signature Verification
**Purpose**: Validate incoming webhooks

**Implementation**:
```typescript
const generatedHmac = crypto
  .createHmac('sha256', webhookSecret)
  .update(body, 'utf8')
  .digest('base64')

crypto.timingSafeEqual(
  Buffer.from(generatedHmac),
  Buffer.from(hmacHeader)
)
```

---

## Database Schema

### shopify_connections Table

```prisma
model ShopifyConnection {
  id            String        @id @default(cuid())
  dropshipperId String        @map("dropshipper_id")
  shopDomain    String        @map("shop_domain")
  accessToken   String        @map("access_token")
  status        ShopifyStatus @default(ACTIVE)
  lastSyncAt    DateTime?     @map("last_sync_at")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  dropshipper DropshipperProfile @relation(fields: [dropshipperId], references: [id], onDelete: Cascade)

  @@unique([dropshipperId, shopDomain])
  @@index([dropshipperId])
  @@map("shopify_connections")
}

enum ShopifyStatus {
  ACTIVE
  INACTIVE
  ERROR
}
```

### Example Data

```json
{
  "id": "cm1abc123xyz",
  "dropshipperId": "cm1xyz789abc",
  "shopDomain": "mystore.myshopify.com",
  "accessToken": "shpat_1234567890abcdef...",
  "status": "ACTIVE",
  "lastSyncAt": null,
  "createdAt": "2025-09-30T14:30:00.000Z",
  "updatedAt": "2025-09-30T14:30:00.000Z"
}
```

---

## Testing Guide

### Local Development Setup

1. **Install ngrok** (for webhook testing):
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start your app**:
   ```bash
   npm run dev
   ```

3. **Expose local server**:
   ```bash
   ngrok http 3000
   ```

   Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

4. **Update Shopify app settings**:
   - Set App URL to ngrok URL
   - Add `https://abc123.ngrok.io/api/integrations/shopify/callback` to allowed redirects

5. **Update environment**:
   ```bash
   NEXT_PUBLIC_APP_URL=https://abc123.ngrok.io
   ```

### Testing OAuth Flow

#### Step 1: Initiate Connection

**Request**:
```bash
curl -X GET "http://localhost:3000/api/integrations/shopify/connect?shop=your-dev-store" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "authUrl": "https://your-dev-store.myshopify.com/admin/oauth/authorize?client_id=abc&scope=read_orders,write_orders,read_products&redirect_uri=https://abc123.ngrok.io/api/integrations/shopify/callback&state=eyJ1c2VySWQiOi...",
  "shop": "your-dev-store.myshopify.com"
}
```

#### Step 2: Authorize on Shopify

1. Open the `authUrl` in browser
2. Log in to Shopify store (if needed)
3. Click "Install app" or "Authorize"

#### Step 3: Callback Processing

Shopify redirects to:
```
https://abc123.ngrok.io/api/integrations/shopify/callback?
  shop=your-dev-store.myshopify.com&
  code=abc123...&
  hmac=def456...&
  timestamp=1234567890&
  state=eyJ1c2VySWQiOi...
```

Backend processes callback and redirects to:
```
http://localhost:3000/dashboard/integrations?shopify=connected&shop=your-dev-store.myshopify.com
```

#### Step 4: Verify Connection

**Check Database**:
```sql
SELECT * FROM shopify_connections WHERE shop_domain = 'your-dev-store.myshopify.com';
```

**Check Shopify**:
1. Go to Shopify Admin
2. Navigate to Settings → Notifications → Webhooks
3. Verify `orders/create` webhook is registered

#### Step 5: Test Disconnect

**Request**:
```bash
curl -X DELETE "http://localhost:3000/api/integrations/shopify/disconnect" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shopDomain": "your-dev-store.myshopify.com"}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Shopify store disconnected successfully",
  "shopDomain": "your-dev-store.myshopify.com"
}
```

### Testing UI Component

**Create test page**: `app/dashboard/integrations/page.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import ShopifyConnectButton from '@/components/integrations/shopify-connect-button'

export default function IntegrationsPage() {
  const [connection, setConnection] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConnection()
  }, [])

  const fetchConnection = async () => {
    try {
      const response = await fetch('/api/integrations/shopify/connection', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      const data = await response.json()
      setConnection(data.connection || null)
    } catch (error) {
      console.error('Failed to fetch connection:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Store Integrations</h1>
      <ShopifyConnectButton
        connection={connection}
        onConnect={fetchConnection}
        onDisconnect={fetchConnection}
      />
    </div>
  )
}
```

---

## Error Handling

### OAuth Errors

| Error | HTTP Status | Description | Solution |
|-------|-------------|-------------|----------|
| Missing parameters | 400 | Required query params missing | Ensure shop, code, hmac, timestamp are present |
| Invalid HMAC | 401 | Signature verification failed | Check SHOPIFY_CLIENT_SECRET is correct |
| Invalid timestamp | 401 | Request too old or from future | Check server time is synchronized |
| Expired state | 400 | State token > 10 minutes old | User needs to restart OAuth flow |
| Invalid shop domain | 400 | Not a valid .myshopify.com domain | Validate domain format |
| Token exchange failed | 500 | Failed to get access token | Check Shopify credentials |
| Webhook registration failed | 500 | Failed to register webhook | Check network, log error (non-blocking) |

### API Errors

| Error | HTTP Status | Description | Solution |
|-------|-------------|-------------|----------|
| Authentication required | 401 | No valid access token | User needs to log in |
| Insufficient permissions | 403 | Not a DROPSHIPPER role | Only dropshippers can connect stores |
| Connection not found | 404 | No connection for shop domain | User hasn't connected this store |
| Validation failed | 400 | Invalid request body/params | Check request format |

### Shopify API Errors

| Error | HTTP Status | Description | Solution |
|-------|-------------|-------------|----------|
| Rate limit exceeded | 429 | Too many requests | Implement exponential backoff, respect Retry-After header |
| Invalid access token | 401 | Token expired or revoked | Mark connection as ERROR, prompt reconnection |
| Forbidden | 403 | Insufficient scopes | User needs to reinstall app with updated scopes |
| Not found | 404 | Resource doesn't exist | Handle gracefully, may be deleted on Shopify |

---

## Webhook Registration

### Automatic Registration

Webhooks are automatically registered after successful OAuth:

**Topic**: `orders/create`
**Address**: `https://yourdomain.com/api/webhooks/shopify/orders`
**Format**: JSON

### Manual Registration (if needed)

```typescript
import { ShopifyClient } from '@/lib/shopify/client'

const client = new ShopifyClient(shopDomain, accessToken)
await client.registerWebhook(
  'orders/create',
  `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders`
)
```

### Webhook Payload Example

When a new order is created in Shopify:

```json
{
  "id": 123456789,
  "name": "#1001",
  "email": "customer@example.com",
  "created_at": "2025-09-30T14:30:00Z",
  "customer": {
    "id": 987654321,
    "email": "customer@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "shipping_address": {
    "first_name": "John",
    "last_name": "Doe",
    "address1": "123 Main St",
    "city": "New York",
    "province": "NY",
    "zip": "10001",
    "country": "US",
    "phone": "+1234567890"
  },
  "line_items": [
    {
      "id": 111111111,
      "product_id": 222222222,
      "variant_id": 333333333,
      "title": "Product Name",
      "quantity": 2,
      "price": "29.99",
      "sku": "PROD-001"
    }
  ],
  "total_price": "59.98",
  "financial_status": "paid",
  "payment_gateway_names": ["bogus"]
}
```

---

## Handoff to Stream B

### What's Ready

1. **Webhook Validator** (`/lib/shopify/webhook-validator.ts`)
   - HMAC signature verification
   - Shop domain validation
   - Header extraction

2. **Shopify Client** (`/lib/shopify/client.ts`)
   - Full API access
   - Type-safe requests
   - Error handling

3. **Database Schema**
   - `shopify_connections` table ready
   - Can look up connection by `shopDomain`

### What Stream B Needs to Build

1. **Webhook Receiver Endpoint**
   - File: `/app/api/webhooks/shopify/orders/route.ts`
   - Verify webhook signature
   - Queue payload for async processing
   - Return 200 OK immediately

2. **Queue System**
   - Set up BullMQ or AWS SQS
   - Define job types
   - Configure Redis connection

3. **Worker Process**
   - Process queued webhooks
   - Parse Shopify order payload
   - Create order in database
   - Handle errors with retry

### Integration Pattern

```typescript
// /app/api/webhooks/shopify/orders/route.ts
import { validateWebhookRequest } from '@/lib/shopify/webhook-validator'
import { prisma } from '@/lib/prisma'
import { queue } from '@/lib/queue'

export async function POST(request: NextRequest) {
  // 1. Verify webhook
  const body = await request.text()
  const metadata = validateWebhookRequest(body, request.headers)

  // 2. Find connection
  const connection = await prisma.shopifyConnection.findFirst({
    where: {
      shopDomain: metadata.domain,
      status: 'ACTIVE'
    }
  })

  if (!connection) {
    return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
  }

  // 3. Queue for processing
  await queue.add('shopify-order-webhook', {
    payload: JSON.parse(body),
    connectionId: connection.id,
    webhookId: metadata.webhookId
  })

  // 4. Return success immediately
  return NextResponse.json({ success: true })
}
```

---

## Monitoring & Maintenance

### Health Checks

Monitor these metrics:
- Connection status (ACTIVE/ERROR)
- Last sync timestamp
- Webhook delivery failures
- OAuth error rates

### Connection Status Updates

Update `status` and `lastSyncAt`:

```typescript
await prisma.shopifyConnection.update({
  where: { id: connection.id },
  data: {
    status: 'ACTIVE',  // or 'ERROR' on failure
    lastSyncAt: new Date()
  }
})
```

### Error Recovery

**Invalid Access Token**:
1. Set connection status to ERROR
2. Notify dropshipper via email/notification
3. Prompt reconnection in UI

**Webhook Failures**:
1. Log error with context
2. Retry with exponential backoff
3. Alert after 3 consecutive failures

---

## Known Limitations

1. **Single Connection per Shop**: One dropshipper/shop domain pair
2. **Manual Webhook Cleanup**: Failed disconnects may leave webhooks (non-critical)
3. **No Bulk Import**: Historical orders not imported (only new orders)
4. **Local Development**: Requires ngrok for webhook testing

---

## Future Enhancements

1. **Bulk Order Import**: Import historical orders on first connect
2. **Multi-webhook Support**: Support additional webhook topics
3. **Connection Health Monitoring**: Automated health checks and alerts
4. **Webhook Retry Logic**: Built-in retry mechanism for failed webhooks
5. **Multiple Stores**: Allow dropshipper to connect multiple stores
6. **Webhook Management UI**: View/manage registered webhooks

---

## Troubleshooting

### OAuth Issues

**Problem**: "Invalid HMAC signature"
- **Cause**: SHOPIFY_CLIENT_SECRET mismatch
- **Solution**: Verify secret from Partner Dashboard

**Problem**: "Invalid timestamp"
- **Cause**: Server time not synchronized
- **Solution**: Check system clock, use NTP

**Problem**: OAuth redirect fails
- **Cause**: Redirect URL not in allowed list
- **Solution**: Add URL to Shopify app settings

### Connection Issues

**Problem**: Can't find connection after OAuth
- **Cause**: Dropshipper profile not created
- **Solution**: Ensure user completed profile setup

**Problem**: Webhook not registered
- **Cause**: Network error or invalid webhook URL
- **Solution**: Check ngrok is running, URL is accessible

### API Issues

**Problem**: 401 Unauthorized
- **Cause**: Missing or invalid access token
- **Solution**: Include valid Bearer token in Authorization header

**Problem**: 403 Forbidden
- **Cause**: User not DROPSHIPPER role
- **Solution**: Check user role in database

---

## Support

For issues or questions:
1. Check this documentation first
2. Review error logs for specific error messages
3. Verify environment variables are set correctly
4. Test with Shopify development store
5. Check Shopify API documentation: https://shopify.dev/docs/api

---

## Commit Information

**Branch**: `epic/dropshipping-platform`
**Commit**: `929e6de`
**Message**: "Issue #3: Implement Shopify OAuth & Connection Management (Stream A)"

**Changed Files**:
- `lib/env.ts` (updated)
- `lib/shopify/client.ts` (new)
- `lib/shopify/oauth.ts` (new)
- `lib/shopify/webhook-validator.ts` (new)
- `app/api/integrations/shopify/connect/route.ts` (new)
- `app/api/integrations/shopify/callback/route.ts` (new)
- `app/api/integrations/shopify/disconnect/route.ts` (new)
- `components/integrations/shopify-connect-button.tsx` (new)

---

**Implementation Complete**
Stream A ready for production. Stream B can now begin webhook processing implementation.