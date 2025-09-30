# Stream A Summary: Database Schema Implementation

## Status: COMPLETED ✅

**Issue**: #2 - Foundation & Infrastructure Setup
**Stream**: Stream A - Database Schema & Prisma Setup
**Branch**: `epic/dropshipping-platform`
**Completed**: 2025-09-30T13:00:00Z

---

## What Was Implemented

### Complete Database Schema (13 Entities)

All 13 core entities have been implemented with proper relationships, constraints, and indexes:

1. **users** - Authentication and user management
2. **dropshipper_profiles** - Extended dropshipper information
3. **suppliers** - Supplier/vendor management
4. **warehouses** - Distribution centers
5. **products** - Product catalog with inventory
6. **orders** - Customer orders
7. **order_items** - Order line items
8. **order_events** - Event sourcing audit trail
9. **wallet_transactions** - Double-entry bookkeeping
10. **deposit_requests** - Deposit approval workflow
11. **withdrawal_requests** - Withdrawal approval workflow
12. **bank_accounts** - Dropshipper bank information
13. **shopify_connections** - Shopify OAuth integrations

### Infrastructure

- **PostgreSQL 15**: Running on Docker (port 5433)
- **Redis 7**: Running on Docker (port 6380)
- **Prisma ORM**: Configured and ready
- **Initial Migration**: Applied successfully
- **Seed Data**: Complete test dataset

---

## Important Information for Stream B (Authentication Agent)

### Users Table Schema

```typescript
model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String     @map("password_hash")
  role         UserRole   // ADMIN | DROPSHIPPER | SUPPORT
  status       UserStatus @default(ACTIVE) // ACTIVE | SUSPENDED | INACTIVE
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

enum UserRole {
  ADMIN
  DROPSHIPPER
  SUPPORT
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  INACTIVE
}
```

### How to Use Prisma Client

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
  include: { dropshipperProfile: true }
});

// Create new user
const newUser = await prisma.user.create({
  data: {
    email: 'newuser@example.com',
    passwordHash: hashedPassword,
    role: 'DROPSHIPPER',
    status: 'ACTIVE'
  }
});
```

### Password Hashing

bcrypt is already installed. Example usage:

```typescript
import * as bcrypt from 'bcrypt';

// Hash password
const hashedPassword = await bcrypt.hash('password123', 10);

// Verify password
const isValid = await bcrypt.compare('password123', user.passwordHash);
```

See `prisma/seed.ts` for a working example.

### Test Credentials

Use these for testing authentication:

- **Admin**: admin@dropshipping.com / password123
- **Dropshipper 1**: dropshipper1@example.com / password123
- **Dropshipper 2**: dropshipper2@example.com / password123

All passwords are hashed with bcrypt (10 rounds).

---

## RBAC Implementation Suggestions

### Role Hierarchy

1. **ADMIN**
   - Full access to all resources
   - Can manage users, approve deposits/withdrawals
   - Can view all orders and transactions
   - Can manage suppliers and products

2. **DROPSHIPPER**
   - Access to own orders, products, and wallet
   - Can create orders, view commission
   - Can request deposits/withdrawals
   - Can manage Shopify connections

3. **SUPPORT**
   - Read-only access to help customers
   - Can view orders and user information
   - Cannot modify financial data

### Suggested Middleware

```typescript
// Example RBAC middleware
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser(); // from JWT

  if (!user) {
    throw new UnauthorizedError();
  }

  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}

// Usage
await requireRole(['ADMIN', 'DROPSHIPPER']);
```

### API Endpoint Suggestions

1. **POST /api/auth/login**
   - Validate email/password
   - Return JWT access token (24h)
   - Set refresh token in HttpOnly cookie (7d)

2. **POST /api/auth/logout**
   - Invalidate refresh token
   - Clear cookies

3. **POST /api/auth/refresh**
   - Validate refresh token
   - Return new access token

4. **GET /api/auth/me**
   - Return current user info from JWT
   - Include dropshipperProfile if role is DROPSHIPPER

5. **POST /api/auth/register**
   - Create new DROPSHIPPER user
   - Create dropshipperProfile
   - Require CUIT validation

---

## Environment Variables

The `.env` file is configured with:

```bash
DATABASE_URL="postgresql://dropshipping_user:dropshipping_password@localhost:5433/dropshipping_db?schema=public"
JWT_SECRET="dev-jwt-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6380"
```

See `.env.example` for full template.

---

## Database Commands

```bash
# View database in Prisma Studio
npm run db:studio

# Apply migrations
npm run db:migrate

# Re-seed database
npm run db:seed

# Reset database (migrations + seed)
npm run db:reset
```

---

## Key Design Decisions

1. **CUID for IDs**: Better for distributed systems than UUID
2. **Snake_case in DB**: Database uses snake_case, TypeScript uses camelCase
3. **Email uniqueness**: Enforced at database level
4. **Password field**: Named `passwordHash` to make it clear passwords are never stored in plain text
5. **User status**: Can be used to suspend accounts without deletion
6. **Soft deletes**: Status enums instead of hard deletes for audit purposes

---

## Database Schema Diagram

```
User (1) -----> (0..1) DropshipperProfile
                           |
                           |---> (*) Orders
                           |---> (*) WalletTransactions
                           |---> (*) DepositRequests
                           |---> (*) WithdrawalRequests
                           |---> (*) BankAccounts
                           |---> (*) ShopifyConnections

Supplier (1) --> (*) Products
         (1) --> (*) Warehouses

Order (1) --> (*) OrderItems --> (1) Product
      (1) --> (*) OrderEvents --> (1) User (changedBy)
      (1) --> (*) WalletTransactions
```

---

## Files Created

### Core Schema
- `/prisma/schema.prisma` - Complete database schema (370+ lines)
- `/prisma/migrations/20250930125347_init/migration.sql` - Initial migration
- `/prisma/seed.ts` - Seed data script (385 lines)

### Configuration
- `/.env.example` - Environment variables template
- `/.env` - Local development configuration (not in git)
- `/docker-compose.yml` - PostgreSQL + Redis
- `/package.json` - Database scripts

### Documentation
- `/STREAM_A_SUMMARY.md` - This file
- `/.claude/epics/dropshipping-platform/updates/2/stream-a.md` - Detailed progress

---

## Next Steps for Stream B

Stream B (Authentication) should implement:

1. **JWT Generation/Validation**
   - Use `jsonwebtoken` library
   - Store secrets in environment variables
   - Set appropriate expiration times

2. **Auth API Endpoints**
   - Login (email/password validation)
   - Logout (token invalidation)
   - Refresh (token renewal)
   - Me (current user info)
   - Optional: Register (dropshipper signup)

3. **RBAC Middleware**
   - Extract user from JWT
   - Check user role and permissions
   - Protect routes based on roles

4. **Session Management**
   - Use Redis for refresh token storage
   - Implement token blacklist for logout
   - Handle token expiration gracefully

5. **Password Security**
   - Use bcrypt for hashing (already installed)
   - Implement password strength validation
   - Consider rate limiting for login attempts

---

## Testing the Database

Start the database:
```bash
docker-compose up -d
```

View data in Prisma Studio:
```bash
npm run db:studio
```

Test authentication against these users:
- Admin: admin@dropshipping.com
- Dropshipper: dropshipper1@example.com, dropshipper2@example.com
- All passwords: password123

---

## Questions or Issues?

If you encounter any issues with the schema or need additional fields:

1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_change_description`
3. Regenerate Prisma Client: `npx prisma generate`

The schema is designed to be flexible and can be extended as needed.

---

**Stream A is complete and ready for Stream B to begin!** 🚀