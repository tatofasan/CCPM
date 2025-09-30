# Database Schema Documentation

## Overview

This directory contains the Prisma schema, migrations, and seed data for the Dropshipping Platform.

## Schema Overview

The database consists of 13 core entities organized into the following domains:

### Core User Management (2 entities)
- **users**: Authentication and user management (ADMIN, DROPSHIPPER, SUPPORT roles)
- **dropshipper_profiles**: Extended dropshipper business information

### Suppliers & Warehouses (2 entities)
- **suppliers**: Supplier/vendor management
- **warehouses**: Distribution centers and fulfillment locations

### Products (1 entity)
- **products**: Product catalog with inventory tracking

### Orders (3 entities)
- **orders**: Customer orders with financial breakdown
- **order_items**: Order line items
- **order_events**: Event sourcing for order state changes (audit trail)

### Wallet & Financial (4 entities)
- **wallet_transactions**: Double-entry bookkeeping for commissions
- **deposit_requests**: Deposit approval workflow
- **withdrawal_requests**: Withdrawal approval workflow
- **bank_accounts**: Dropshipper bank account information

### Integrations (1 entity)
- **shopify_connections**: Shopify OAuth connections

## Quick Start

### Start Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5433 and Redis on port 6380.

### Apply Migrations

```bash
npm run db:migrate
```

### Seed Database

```bash
npm run db:seed
```

This creates:
- 1 Admin user
- 2 Dropshipper users with profiles
- 2 Suppliers
- 2 Warehouses
- 5 Products
- 1 Sample order
- Bank accounts, transactions, and Shopify connections

### Open Prisma Studio

```bash
npm run db:studio
```

Browse and edit your database at http://localhost:5555

## Test Credentials

After seeding:

- **Admin**: admin@dropshipping.com / password123
- **Dropshipper 1**: dropshipper1@example.com / password123
- **Dropshipper 2**: dropshipper2@example.com / password123

## Schema Features

### Double-Entry Bookkeeping

The `wallet_transactions` table implements double-entry accounting:

```typescript
{
  debitAmount: 0,      // Money out
  creditAmount: 14250, // Money in
  balanceAfter: 14250  // Running balance
}
```

### Event Sourcing

The `order_events` table provides an immutable audit trail:

```typescript
{
  orderId: "...",
  fromState: "PENDING",
  toState: "CONFIRMED",
  changedByUserId: "...",
  reason: "Payment confirmed",
  metadata: { ... },
  createdAt: "2025-09-30T12:00:00Z"
}
```

### JSONB Fields

Flexible data stored as JSON:
- `orders.shippingAddress`: Customer shipping information
- `products.dimensions`: Product measurements
- `order_events.metadata`: Additional event context

## Key Indexes

Performance indexes on critical queries:

```prisma
// Orders
@@index([dropshipperId])
@@index([state])
@@index([createdAt])
@@index([shopifyOrderId])

// Wallet Transactions
@@index([dropshipperId])
@@index([createdAt])
@@index([type])

// Products
@@index([sku])
@@index([supplierId])
@@index([stock])
```

## Relationships

### One-to-One
- User → DropshipperProfile

### One-to-Many
- User → OrderEvents (as changedBy)
- User → WalletTransactions (as createdBy)
- DropshipperProfile → Orders
- DropshipperProfile → WalletTransactions
- Supplier → Products
- Supplier → Warehouses
- Order → OrderItems
- Order → OrderEvents

### Many-to-Many
- None (simplified for initial version)

## Data Integrity

### Cascade Rules

- **Cascade on Delete**:
  - User → DropshipperProfile
  - Supplier → Warehouse
  - Order → OrderItems
  - Order → OrderEvents

- **Restrict on Delete**:
  - Product → OrderItems (prevents deleting products with orders)
  - DropshipperProfile → Orders (prevents deleting dropshippers with orders)

- **Set Null on Delete**:
  - Order → WalletTransaction (order can be deleted, transaction remains)
  - User → DepositRequest/WithdrawalRequest (reviewer can be deleted)

## Common Queries

### Find User with Profile

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'dropshipper1@example.com' },
  include: { dropshipperProfile: true }
});
```

### Get Orders with Items

```typescript
const orders = await prisma.order.findMany({
  where: { dropshipperId: profileId },
  include: {
    items: {
      include: { product: true }
    },
    events: true
  },
  orderBy: { createdAt: 'desc' }
});
```

### Calculate Wallet Balance

```typescript
const transactions = await prisma.walletTransaction.findMany({
  where: { dropshipperId: profileId },
  orderBy: { createdAt: 'desc' },
  take: 1
});

const currentBalance = transactions[0]?.balanceAfter || 0;
```

## Environment Variables

Required environment variables (see `.env.example`):

```bash
DATABASE_URL="postgresql://user:password@localhost:5433/dropshipping_db?schema=public"
```

## Useful Commands

```bash
# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Reset database (dangerous!)
npm run db:reset

# Create new migration
npx prisma migrate dev --name migration_name

# Push schema without migration
npm run db:push

# View database in Studio
npm run db:studio
```

## Migration History

- **20250930125347_init**: Initial schema with all 13 entities

## Notes for Developers

### Adding New Fields

1. Update `schema.prisma`
2. Run `npx prisma migrate dev --name add_field_name`
3. Update seed data if needed
4. Regenerate client: `npx prisma generate`

### Changing Existing Fields

Be careful with production data:
- Use migrations for schema changes
- Test migrations on staging first
- Consider data migration scripts

### Best Practices

1. Always use transactions for financial operations
2. Create order events for all state changes
3. Validate CUIT format before saving
4. Use unique constraints (email, sku, cuit)
5. Index foreign keys and frequently queried fields

## Troubleshooting

### Connection Errors

Check if PostgreSQL is running:
```bash
docker-compose ps
```

View logs:
```bash
docker-compose logs postgres
```

### Migration Conflicts

Reset database (development only):
```bash
npm run db:reset
```

### Seed Errors

Check if tables exist:
```bash
npx prisma db push
```

Then re-run seed:
```bash
npm run db:seed
```

## Production Considerations

1. **Backups**: Set up automated PostgreSQL backups
2. **Connection Pooling**: Use Prisma connection pooling or PgBouncer
3. **Monitoring**: Monitor slow queries and index usage
4. **Security**: Use strong passwords and SSL connections
5. **Scaling**: Consider read replicas for reporting

## Related Documentation

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Design Best Practices](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate)

## Support

For questions or issues with the database schema, please open an issue in the repository.