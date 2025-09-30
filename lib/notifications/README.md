# Notification System

Comprehensive in-app notification system for the dropshipping platform.

## Quick Start

```typescript
import { createNotification } from '@/lib/notifications/create';
import { NotificationType } from '@/lib/notifications/types';

// Create a notification
await createNotification(
  userId,
  NotificationType.NEW_ORDER,
  'New Order Received',
  'Order #12345 from John Doe',
  { orderId: 'clx...', customerName: 'John Doe' }
);
```

## Files

- `types.ts` - Notification types and type definitions
- `create.ts` - Core notification creation logic
- `examples.ts` - Example usage for all notification types
- `README.md` - This file

## Notification Types

All available notification types:

| Type | Description | When to Use |
|------|-------------|-------------|
| `NEW_ORDER` | New order synced from Shopify | After order sync |
| `ORDER_CONFIRMED` | Dropshipper confirmed order | After confirmation |
| `ORDER_STATUS_CHANGE` | Order state changed | After state transition |
| `WITHDRAWAL_APPROVED` | Withdrawal request approved | Admin approval |
| `WITHDRAWAL_REJECTED` | Withdrawal request rejected | Admin rejection |
| `DEPOSIT_APPROVED` | Deposit approved | Admin approval |
| `DEPOSIT_REJECTED` | Deposit rejected | Admin rejection |
| `LOW_STOCK_ALERT` | Stock below threshold | Stock check |
| `TICKET_CREATED` | Support ticket created | After ticket creation |
| `TICKET_REPLY` | Reply added to ticket | After reply |

## Functions

### createNotification

Creates a notification for a user. Automatically checks user preferences.

```typescript
async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: NotificationMetadata
): Promise<Notification | null>
```

**Returns:** The created notification or `null` if user has disabled that type.

### createBulkNotifications

Creates multiple notifications at once (useful for broadcasting).

```typescript
async function createBulkNotifications(
  notifications: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: NotificationMetadata;
  }>
): Promise<{ created: number; failed: number }>
```

### shouldSendEmail

Checks if email notification should be sent for a notification type.

```typescript
async function shouldSendEmail(
  userId: string,
  type: NotificationType
): Promise<boolean>
```

**Use in Email System (Stream A):**

```typescript
const sendEmail = await shouldSendEmail(userId, NotificationType.NEW_ORDER);
if (sendEmail) {
  // Send email via SendGrid/SES
}
```

## Metadata Structure

Metadata can contain any additional information. Common fields:

```typescript
interface NotificationMetadata {
  orderId?: string;
  orderNumber?: string;
  customerName?: string;
  amount?: number;
  productName?: string;
  productSku?: string;
  stockLevel?: number;
  ticketId?: string;
  ticketSubject?: string;
  withdrawalRequestId?: string;
  depositRequestId?: string;
  oldState?: string;
  newState?: string;
  [key: string]: any; // Additional custom fields
}
```

## API Endpoints

### List Notifications
```bash
GET /api/notifications?page=1&limit=20&read=false&type=NEW_ORDER
```

### Mark as Read
```bash
PATCH /api/notifications/:id/read
```

### Mark All as Read
```bash
POST /api/notifications/mark-all-read
```

### Get Unread Count
```bash
GET /api/notifications/unread-count
```

### Get Preferences
```bash
GET /api/notifications/preferences
```

### Update Preferences
```bash
PATCH /api/notifications/preferences
Content-Type: application/json

{
  "emailEnabled": true,
  "inappEnabled": true,
  "preferences": {
    "NEW_ORDER": { "email": true, "inapp": true }
  }
}
```

### Real-Time Stream (SSE)
```bash
GET /api/notifications/stream
```

## Integration Examples

### Order System

```typescript
// When order is synced from Shopify
import { createNotification } from '@/lib/notifications/create';
import { NotificationType } from '@/lib/notifications/types';

await createNotification(
  order.dropshipperId,
  NotificationType.NEW_ORDER,
  'New Order Received',
  `Order #${order.shopifyOrderId} from ${order.customerName}`,
  {
    orderId: order.id,
    orderNumber: order.shopifyOrderId,
    customerName: order.customerName,
    amount: parseFloat(order.totalAmount.toString())
  }
);
```

### Wallet System

```typescript
// When withdrawal is approved
await createNotification(
  dropshipperId,
  NotificationType.WITHDRAWAL_APPROVED,
  'Withdrawal Approved',
  `Your withdrawal of $${amount} has been approved`,
  { withdrawalRequestId, amount }
);
```

### Inventory System

```typescript
// When stock is low
if (product.stock < product.lowStockThreshold) {
  await createNotification(
    dropshipperId,
    NotificationType.LOW_STOCK_ALERT,
    'Low Stock Alert',
    `${product.name} is running low. Current: ${product.stock}`,
    {
      productId: product.id,
      productSku: product.sku,
      stockLevel: product.stock
    }
  );
}
```

### Support System

```typescript
// When ticket is created
await createNotification(
  userId,
  NotificationType.TICKET_CREATED,
  'Support Ticket Created',
  `Ticket #${ticketNumber} created`,
  { ticketId, ticketSubject }
);
```

## User Preferences

Users can customize their notification preferences:

1. **Global Settings:**
   - Enable/disable all email notifications
   - Enable/disable all in-app notifications

2. **Type-Specific Settings:**
   - For each notification type, users can:
     - Enable/disable email
     - Enable/disable in-app

3. **Default Settings:**
   - All notifications enabled by default
   - Users can opt-out selectively

## Real-Time Delivery

The system uses Server-Sent Events (SSE) for real-time delivery:

1. **Client connects** to `/api/notifications/stream`
2. **Server polls** database every 5 seconds
3. **New notifications pushed** to client immediately
4. **Heartbeat sent** every 5 seconds to keep connection alive

### Client Implementation

```typescript
const eventSource = new EventSource('/api/notifications/stream', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  switch (data.type) {
    case 'connected':
      console.log('Connected to notification stream');
      break;
    case 'notification':
      // New notification received
      handleNewNotification(data.data);
      break;
    case 'heartbeat':
      // Keep-alive message
      break;
  }
});

eventSource.addEventListener('error', (error) => {
  console.error('SSE error:', error);
  eventSource.close();
});
```

## Scalability Considerations

For production with multiple server instances:

1. **Redis Pub/Sub:**
   - Publish notification events to Redis
   - All servers subscribe to channel
   - Push to connected clients

2. **WebSocket Alternative:**
   - Use Socket.io or native WebSockets
   - Requires sticky sessions or Redis adapter

3. **Third-Party Services:**
   - Pusher, Ably, or Pusher Beams
   - Managed infrastructure
   - Built-in scaling

## Testing

```typescript
import { createNotification } from '@/lib/notifications/create';
import { NotificationType } from '@/lib/notifications/types';
import { prisma } from '@/lib/prisma';

// Test notification creation
const notification = await createNotification(
  'test-user-id',
  NotificationType.NEW_ORDER,
  'Test Order',
  'This is a test order notification',
  { orderId: 'test-123' }
);

expect(notification).toBeDefined();
expect(notification.type).toBe('NEW_ORDER');

// Test preference check
const preferences = await prisma.notificationPreference.findUnique({
  where: { userId: 'test-user-id' }
});

expect(preferences).toBeDefined();
```

## See Also

- `/app/api/notifications/*` - API endpoint implementations
- `examples.ts` - Detailed usage examples
- `.claude/epics/dropshipping-platform/updates/9/stream-b.md` - Full documentation