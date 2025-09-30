# Email System Implementation Summary

## Overview

Complete email notification system for CCPM Dropshipping Platform (Task #9, Stream A).

**Status**: ✅ COMPLETED

## Architecture

```
┌─────────────────┐
│  Application    │
│  (Next.js API)  │
└────────┬────────┘
         │ queueEmail()
         ▼
┌─────────────────┐      ┌──────────────┐
│  Email Sender   │─────▶│  BullMQ      │
│  (lib/email)    │      │  Queue       │
└─────────────────┘      └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  Email       │
                         │  Worker      │
                         └──────┬───────┘
                                │
                                ▼
                         ┌──────────────┐
                         │  SendGrid    │
                         │  API         │
                         └──────────────┘
```

## Components

### 1. Queue Infrastructure

#### `/lib/queue/setup.ts`
- BullMQ queue configuration
- Redis connection management
- Queue settings: 3 retries with exponential backoff
- Job retention policies

#### `/lib/queue/jobs/email.ts`
- Email job processor
- Template rendering
- Error handling and retry logic
- Delivery status tracking

### 2. Email Client

#### `/lib/email/client.ts`
- SendGrid integration
- Email delivery with error handling
- Delivery status tracking (delivered, bounced, failed)
- Batch email sending support

**Key Functions**:
- `sendEmail(params)` - Send single email via SendGrid
- `sendEmailBatch(emails)` - Send multiple emails

### 3. Email Sender

#### `/lib/email/sender.ts`
- Template rendering with React Email
- Email queueing interface
- Helper functions for common email types

**Key Functions**:
- `queueEmail(to, subject, template, variables)` - Queue any email
- `sendNewOrderEmail(to, orderData)` - New order notification
- `sendOrderConfirmedEmail(to, orderData)` - Order confirmation
- `sendOrderStatusChangeEmail(to, orderData)` - Status update
- `sendWithdrawalApprovedEmail(to, data)` - Withdrawal approved
- `sendWithdrawalRejectedEmail(to, data)` - Withdrawal rejected
- `sendDepositApprovedEmail(to, data)` - Deposit approved
- `sendDepositRejectedEmail(to, data)` - Deposit rejected
- `sendLowStockAlertEmail(to, data)` - Low stock alert

### 4. Email Templates

All templates use React Email with responsive design and consistent branding.

#### `/lib/email/templates/new-order.tsx`
**Purpose**: Notify dropshipper of new order from Shopify
**Variables**: `orderNumber`, `customerName`, `customerEmail`, `totalAmount`, `itemCount`

#### `/lib/email/templates/order-confirmed.tsx`
**Purpose**: Confirm order to customer
**Variables**: `orderNumber`, `customerName`, `totalAmount`, `estimatedDelivery`

#### `/lib/email/templates/order-status-change.tsx`
**Purpose**: Notify status changes
**Variables**: `orderNumber`, `customerName`, `oldStatus`, `newStatus`, `statusMessage`, `trackingNumber`

#### `/lib/email/templates/withdrawal-approved.tsx`
**Purpose**: Notify withdrawal approval
**Variables**: `userName`, `amount`, `bankAccount`, `referenceNumber`, `estimatedDate`

#### `/lib/email/templates/withdrawal-rejected.tsx`
**Purpose**: Notify withdrawal rejection
**Variables**: `userName`, `amount`, `reason`

#### `/lib/email/templates/deposit-approved.tsx`
**Purpose**: Notify deposit approval
**Variables**: `userName`, `amount`, `newBalance`, `referenceNumber`

#### `/lib/email/templates/deposit-rejected.tsx`
**Purpose**: Notify deposit rejection with common reasons
**Variables**: `userName`, `amount`, `reason`

#### `/lib/email/templates/low-stock-alert.tsx`
**Purpose**: Alert admin of low/out-of-stock products
**Variables**: `productName`, `sku`, `currentStock`, `threshold`, `supplierName`

### 5. Worker Process

#### `/workers/email-worker.ts`
- Background worker for processing email queue
- Concurrency: 5 jobs simultaneously
- Rate limiting: 100 emails per minute
- Graceful shutdown handling

## Configuration

### Environment Variables

Add to `.env`:
```env
# Redis (required)
REDIS_URL="redis://localhost:6379"

# SendGrid (required)
SENDGRID_API_KEY="your-sendgrid-api-key"
EMAIL_FROM="noreply@yourdomain.com"
EMAIL_FROM_NAME="CCPM Dropshipping"

# App URL (optional, defaults to localhost)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### NPM Scripts

```bash
# Run email worker (production)
npm run worker:email

# Run email worker with auto-reload (development)
npm run worker:email:dev
```

## Usage Examples

### Basic Email Sending

```typescript
import { sendNewOrderEmail } from '@/lib/email/sender';

// Send new order notification
await sendNewOrderEmail('dropshipper@example.com', {
  orderNumber: '12345',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  totalAmount: '150.00',
  itemCount: 3,
});
```

### Custom Email

```typescript
import { queueEmail } from '@/lib/email/sender';

await queueEmail(
  'user@example.com',
  'Custom Subject',
  'template-name',
  {
    variable1: 'value1',
    variable2: 'value2',
  }
);
```

### Multiple Recipients

```typescript
import { sendLowStockAlertEmail } from '@/lib/email/sender';

// Send to multiple admins
await sendLowStockAlertEmail(
  ['admin1@example.com', 'admin2@example.com'],
  {
    productName: 'Product ABC',
    sku: 'ABC-123',
    currentStock: 5,
    threshold: 10,
    supplierName: 'Supplier XYZ',
  }
);
```

### Integration Example

```typescript
// In your order processing logic
import { sendNewOrderEmail, sendOrderConfirmedEmail } from '@/lib/email/sender';
import { prisma } from '@/lib/prisma';

// When new order is created
const order = await prisma.order.create({
  data: orderData,
  include: {
    dropshipper: {
      include: {
        user: true,
      },
    },
  },
});

// Notify dropshipper
await sendNewOrderEmail(order.dropshipper.user.email, {
  orderNumber: order.id,
  customerName: order.customerName,
  customerEmail: order.customerEmail,
  totalAmount: order.totalAmount.toString(),
  itemCount: order.items.length,
});

// When order is confirmed
await sendOrderConfirmedEmail(order.customerEmail, {
  orderNumber: order.id,
  customerName: order.customerName,
  totalAmount: order.totalAmount.toString(),
  estimatedDelivery: '5-7 business days',
});
```

## Queue Job Structure

Jobs in the queue have this structure:

```typescript
{
  to: 'user@example.com' | ['user1@example.com', 'user2@example.com'],
  subject: 'Email Subject',
  template: 'template-name',
  variables: {
    // Template-specific variables
  }
}
```

## Error Handling

### Retry Logic
- **Attempts**: 3 automatic retries
- **Backoff**: Exponential (2s, 4s, 8s)
- **After failure**: Job moved to failed queue

### Delivery Status
- `delivered` - Successfully sent
- `bounced` - Invalid recipient (4xx errors)
- `failed` - Server/service error (5xx errors)

### Critical Email Handling
Critical emails (withdrawals, deposits, order confirmations) are flagged for:
- Console logging
- Future: In-app notification fallback
- Future: Admin alerting
- Future: Manual retry capability

## Running the System

### Development

1. Start Redis:
```bash
docker-compose up -d redis
```

2. Start Next.js app:
```bash
npm run dev
```

3. Start email worker (separate terminal):
```bash
npm run worker:email:dev
```

### Production

1. Ensure Redis is running

2. Start worker with process manager:
```bash
pm2 start workers/email-worker.ts --name email-worker
```

3. Start Next.js app:
```bash
npm run build && npm start
```

## Monitoring

### Queue Monitoring
- Install BullMQ Board for web UI:
```bash
npm install @bull-board/express @bull-board/api
```

### Logs
- Worker logs: stdout/stderr or PM2 logs
- Job failures: Console + failed queue
- Delivery status: Logged in job completion

## Testing

### Manual Testing

```typescript
// Create a test script: scripts/test-email.ts
import { sendNewOrderEmail } from '@/lib/email/sender';

async function test() {
  await sendNewOrderEmail('your-email@example.com', {
    orderNumber: 'TEST-001',
    customerName: 'Test Customer',
    totalAmount: '99.99',
    itemCount: 2,
  });
}

test();
```

Run:
```bash
ts-node scripts/test-email.ts
```

### Verify SendGrid Setup

1. Verify sender email in SendGrid dashboard
2. Check API key has sending permissions
3. Test with a real email address you control

## Integration Notes

### For Stream B (In-App Notifications)
Email sending is independent of in-app notifications. Both can be triggered simultaneously:

```typescript
import { createNotification } from '@/lib/notifications/create';
import { sendOrderConfirmedEmail } from '@/lib/email/sender';

// Create in-app notification
await createNotification(userId, {
  type: 'ORDER_CONFIRMED',
  title: 'Order Confirmed',
  message: `Your order #${orderId} has been confirmed`,
});

// Send email
await sendOrderConfirmedEmail(userEmail, orderData);
```

### For Stream C (Support Tickets)
Support tickets can send emails using the same system:

```typescript
import { queueEmail } from '@/lib/email/sender';

// Custom email for support ticket
await queueEmail(
  userEmail,
  'Support Ticket Response',
  'custom-template', // Create custom template if needed
  {
    userName: user.name,
    ticketNumber: ticket.id,
    message: reply.message,
  }
);
```

Or use the raw SendGrid client:

```typescript
import { sendEmail } from '@/lib/email/client';

await sendEmail({
  to: userEmail,
  subject: 'Support Ticket Update',
  html: customHtmlContent,
});
```

## Troubleshooting

### Emails Not Sending

1. Check Redis is running: `redis-cli ping`
2. Check worker is running: `pm2 status` or check terminal
3. Check SendGrid API key: `echo $SENDGRID_API_KEY`
4. Check SendGrid sender verification
5. Check worker logs for errors

### Template Rendering Errors

1. Verify all required variables are passed
2. Check template syntax (TSX)
3. Test template in isolation
4. Check React Email component imports

### Queue Issues

1. Check Redis connection
2. Monitor queue size: Use BullMQ Board
3. Check for stalled jobs
4. Restart worker if needed

## Dependencies

Installed packages:
- `bullmq@^5.59.0` - Job queue
- `@sendgrid/mail@^8.1.6` - SendGrid client
- `react-email@^4.2.12` - Email template framework
- `@react-email/components@^0.5.5` - Email components
- `@react-email/render@^1.3.1` - Template rendering
- `ioredis@^5.8.0` - Redis client (already installed)

## Future Enhancements

- [ ] Email delivery tracking (open/click rates)
- [ ] Email audit log in database
- [ ] SendGrid webhook handler for events
- [ ] Email preview endpoint for testing
- [ ] A/B testing for templates
- [ ] Unsubscribe link management
- [ ] Email analytics dashboard
- [ ] Support ticket email templates
- [ ] Scheduled email campaigns

## Files Created

### Core Files
- `/lib/queue/setup.ts` - Queue configuration
- `/lib/queue/jobs/email.ts` - Job processor
- `/lib/email/client.ts` - SendGrid client
- `/lib/email/sender.ts` - Email sender interface

### Templates
- `/lib/email/templates/new-order.tsx`
- `/lib/email/templates/order-confirmed.tsx`
- `/lib/email/templates/order-status-change.tsx`
- `/lib/email/templates/withdrawal-approved.tsx`
- `/lib/email/templates/withdrawal-rejected.tsx`
- `/lib/email/templates/deposit-approved.tsx`
- `/lib/email/templates/deposit-rejected.tsx`
- `/lib/email/templates/low-stock-alert.tsx`

### Worker
- `/workers/email-worker.ts` - Background worker

### Configuration
- Updated `/lib/env.ts` - Environment variables
- Updated `/.env.example` - Configuration template
- Updated `/package.json` - NPM scripts

## Support

For questions or issues related to the email system:
1. Check logs: Worker console or PM2 logs
2. Verify configuration: Environment variables
3. Test SendGrid: Use SendGrid API explorer
4. Check queue: Use BullMQ Board

---

**Stream A Status**: ✅ COMPLETE
**Ready for**: Integration with Streams B, C, and D
**Last Updated**: 2025-09-30