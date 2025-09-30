# Stream B Summary: Authentication System Implementation

## Status: COMPLETED

**Issue**: #2 - Foundation & Infrastructure Setup
**Stream**: Stream B - Authentication System (JWT + RBAC)
**Branch**: `epic/dropshipping-platform`
**Completed**: 2025-09-30T15:30:00Z

---

## What Was Implemented

### Complete JWT-based Authentication System

1. **JWT Token Management** - Token generation, verification, and rotation
2. **Password Security** - bcrypt hashing with strength validation
3. **RBAC System** - Comprehensive role and permission-based access control
4. **Session Management** - Redis-based session and token storage
5. **API Endpoints** - Login, logout, refresh, and user info endpoints
6. **Middleware** - Global and reusable middleware for route protection

---

## Quick Start Guide

### 1. Environment Setup

Ensure these environment variables are set (already in `.env`):

```bash
JWT_SECRET="dev-jwt-secret-change-in-production-at-least-32-chars"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production-at-least-32-chars"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6380"
```

### 2. Start Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Start Next.js dev server
npm run dev
```

### 3. Test Authentication

Use these test credentials (from seed data):

- **Admin**: admin@dropshipping.com / password123
- **Dropshipper 1**: dropshipper1@example.com / password123
- **Dropshipper 2**: dropshipper2@example.com / password123

---

## API Endpoints

### POST `/api/auth/login`

Authenticate user and get tokens.

**Request:**
```json
{
  "email": "admin@dropshipping.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "clxyz123",
    "email": "admin@dropshipping.com",
    "role": "ADMIN",
    "status": "ACTIVE",
    "dropshipperProfile": null
  }
}
```

**Cookie Set:** `refreshToken` (HttpOnly, 7 days)

---

### POST `/api/auth/logout`

Invalidate session and blacklist tokens.

**Request:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Cookie Cleared:** `refreshToken`

---

### POST `/api/auth/refresh`

Get new access token using refresh token.

**Request:**
```
Cookie: refreshToken=<refresh_token>
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

**Cookie Updated:** `refreshToken` (rotated)

---

### GET `/api/auth/me`

Get current user information.

**Request:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "clxyz123",
    "email": "dropshipper1@example.com",
    "role": "DROPSHIPPER",
    "status": "ACTIVE",
    "dropshipperProfile": {
      "id": "clxyz456",
      "cuit": "20-12345678-9",
      "razonSocial": "Dropshipper One",
      "commissionRate": 15.00,
      "bankAccounts": [...],
      "shopifyConnections": [...]
    }
  }
}
```

---

## JWT Token Structure

### Access Token (24h)

```json
{
  "userId": "clxyz123",
  "email": "user@example.com",
  "role": "DROPSHIPPER",
  "status": "ACTIVE",
  "iat": 1696089600,
  "exp": 1696176000,
  "iss": "dropshipping-platform",
  "aud": "dropshipping-api"
}
```

### Refresh Token (7d)

Same structure as access token, but signed with different secret and longer expiration.

---

## RBAC System

### Roles

1. **ADMIN** - Full system access
2. **DROPSHIPPER** - Access to own resources
3. **SUPPORT** - Read-only access for support

### Key Permissions

#### Admin Permissions
- `users:read`, `users:write`, `users:delete`
- `orders:read:all`, `orders:update_state`
- `wallet:read:all`, `wallet:approve_deposit`, `wallet:approve_withdrawal`
- `products:write`, `products:delete`
- `suppliers:write`, `suppliers:delete`
- `profile:read:all`, `profile:write:all`
- `analytics:read`, `reports:read`

#### Dropshipper Permissions
- `orders:read:own`, `orders:write`
- `products:read`
- `wallet:read:own`, `wallet:request_deposit`, `wallet:request_withdrawal`
- `shopify:read:own`, `shopify:write:own`
- `profile:read:own`, `profile:write:own`
- `bank_accounts:read:own`, `bank_accounts:write:own`
- `analytics:read`

#### Support Permissions
- `orders:read:all`
- `products:read`
- `suppliers:read`
- `profile:read:all`
- `bank_accounts:read:all`

### Using Permissions

```typescript
import { hasPermission, Permission } from '@/lib/auth/rbac';
import { UserRole } from '@prisma/client';

// Check if user has permission
const canApproveWithdrawal = hasPermission(
  UserRole.ADMIN,
  Permission.WALLET_APPROVE_WITHDRAWAL
); // true
```

---

## How to Use Auth in Your API Endpoints

### Option 1: Use Middleware Functions

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requirePermission } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // 401 Unauthorized
  }

  const { user } = authResult;

  // Now you have access to user.userId, user.email, user.role
  // ... your endpoint logic
}

export async function POST(request: NextRequest) {
  // Require specific permission
  const authResult = await requirePermission(
    request,
    Permission.ORDERS_WRITE
  );

  if (authResult instanceof NextResponse) {
    return authResult; // 401 or 403
  }

  const { user } = authResult;

  // ... your endpoint logic
}
```

### Option 2: Get User from Request Headers

The global middleware adds user info to headers for all protected routes:

```typescript
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const userEmail = request.headers.get('x-user-email');
  const userRole = request.headers.get('x-user-role');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... your endpoint logic
}
```

### Option 3: Require Multiple Permissions

```typescript
import { requireAnyPermission } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  // User needs either permission
  const authResult = await requireAnyPermission(request, [
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_READ_OWN,
  ]);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Check which permission they have and filter data accordingly
  const canSeeAll = hasPermission(
    user.role as UserRole,
    Permission.ORDERS_READ_ALL
  );

  if (canSeeAll) {
    // Return all orders
  } else {
    // Return only user's orders
  }
}
```

### Option 4: Require Specific Role

```typescript
import { requireRole } from '@/lib/auth/middleware';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  // Only admins can access
  const authResult = await requireRole(request, [UserRole.ADMIN]);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // ... admin-only logic
}
```

---

## Route Protection

### Global Middleware

The global middleware (`/middleware.ts`) automatically protects routes:

**Public Routes:**
- `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- `/api/auth/login`, `/api/auth/refresh`, `/api/auth/register`

**Protected Routes:**
- `/dashboard`, `/orders`, `/products`, `/wallet`, `/settings`, `/profile`
- `/api/auth/logout`, `/api/auth/me`, `/api/orders`, `/api/products`, `/api/wallet`

**Behavior:**
- Unauthenticated page requests → Redirect to `/login?redirect=<original_path>`
- Unauthenticated API requests → 401 JSON response
- Inactive accounts → Redirect to `/account-inactive` or 403 response

---

## Testing the Auth Flow

### Test Login Flow

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dropshipping.com","password":"password123"}' \
  -c cookies.txt

# Save the access token from response
```

### Test Protected Endpoint

```bash
# 2. Get current user
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <access_token>" \
  -b cookies.txt
```

### Test Token Refresh

```bash
# 3. Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# New access token in response
```

### Test Logout

```bash
# 4. Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <access_token>" \
  -b cookies.txt
```

---

## Password Utilities

### Hash a Password

```typescript
import { hashPassword } from '@/lib/auth/password';

const hashedPassword = await hashPassword('myPassword123');
```

### Verify a Password

```typescript
import { comparePassword } from '@/lib/auth/password';

const isValid = await comparePassword('myPassword123', user.passwordHash);
```

### Validate Password Strength

```typescript
import { validatePasswordStrength } from '@/lib/auth/password';

const { isValid, errors } = validatePasswordStrength('weak');
// { isValid: false, errors: ['Must be at least 8 characters', ...] }
```

---

## Redis Session Management

All Redis operations are handled automatically by the auth endpoints, but you can use them directly:

```typescript
import {
  storeRefreshToken,
  getRefreshToken,
  deleteRefreshToken,
  blacklistToken,
  isTokenBlacklisted,
} from '@/lib/auth/redis';

// Store refresh token (7 days)
await storeRefreshToken(userId, token, 7 * 24 * 60 * 60);

// Get refresh token
const token = await getRefreshToken(userId);

// Delete refresh token (logout)
await deleteRefreshToken(userId);

// Blacklist access token
await blacklistToken(accessToken, 24 * 60 * 60);

// Check if blacklisted
const isBlacklisted = await isTokenBlacklisted(accessToken);
```

---

## Security Best Practices

### Token Storage

1. **Access Token**: Store in memory or localStorage (client-side)
   - Short-lived (24h)
   - Sent in Authorization header
   - Not persisted in HttpOnly cookies (XSS protection)

2. **Refresh Token**: HttpOnly cookie (automatic)
   - Long-lived (7d)
   - Cannot be accessed by JavaScript
   - Rotated on each refresh

### Password Security

1. **Hashing**: bcrypt with cost factor 12
2. **Strength Validation**: Minimum 8 chars, uppercase, lowercase, number
3. **Generic Errors**: "Invalid credentials" prevents email enumeration

### Token Security

1. **Separate Secrets**: Different secrets for access and refresh tokens
2. **Token Rotation**: Refresh tokens are rotated on each use
3. **Token Blacklisting**: Revoked tokens are blacklisted in Redis
4. **Expiration**: Automatic cleanup via Redis TTL

### Account Security

1. **Status Checks**: Only ACTIVE accounts can authenticate
2. **Session Invalidation**: Logout blacklists tokens and clears Redis
3. **Single Session**: One refresh token per user (new login invalidates old)

---

## Files Created

### Authentication Core
- `/lib/auth/jwt.ts` - JWT token utilities
- `/lib/auth/password.ts` - Password hashing utilities
- `/lib/auth/rbac.ts` - RBAC permissions system
- `/lib/auth/redis.ts` - Redis session management
- `/lib/auth/middleware.ts` - Reusable middleware functions

### API Endpoints
- `/app/api/auth/login/route.ts` - Login endpoint
- `/app/api/auth/logout/route.ts` - Logout endpoint
- `/app/api/auth/refresh/route.ts` - Token refresh endpoint
- `/app/api/auth/me/route.ts` - Get current user endpoint

### Middleware
- `/middleware.ts` - Global Next.js middleware for route protection

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
│  (Browser / Mobile App)                                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 1. POST /api/auth/login
                  │    { email, password }
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Login Endpoint                           │
│  - Validate credentials                                     │
│  - Check user status                                        │
│  - Generate tokens                                          │
│  - Store refresh token in Redis                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 2. Returns access token + sets cookie
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                        Client                               │
│  - Stores access token in memory                            │
│  - Refresh token in HttpOnly cookie                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 3. Protected API request
                  │    Authorization: Bearer <access_token>
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Global Middleware                         │
│  - Extract token from header                                │
│  - Check if blacklisted (Redis)                             │
│  - Verify JWT signature                                     │
│  - Check user status                                        │
│  - Add user to request headers                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 4. Request with user context
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Protected Endpoint                         │
│  - Get user from headers or requireAuth()                   │
│  - Check permissions with RBAC                              │
│  - Process business logic                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      Token Refresh Flow                     │
├─────────────────────────────────────────────────────────────┤
│  1. Access token expires (24h)                              │
│  2. Client calls POST /api/auth/refresh                     │
│  3. Refresh token verified (cookie + Redis)                 │
│  4. New access token generated                              │
│  5. Refresh token rotated                                   │
│  6. Client receives new access token                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       Logout Flow                           │
├─────────────────────────────────────────────────────────────┤
│  1. Client calls POST /api/auth/logout                      │
│  2. Access token blacklisted in Redis (24h TTL)             │
│  3. Refresh token deleted from Redis                        │
│  4. Refresh token cookie cleared                            │
│  5. Client discards access token                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Common Use Cases

### Use Case 1: Admin-Only Endpoint

```typescript
import { requireRole } from '@/lib/auth/middleware';
import { UserRole } from '@prisma/client';

export async function DELETE(request: NextRequest) {
  const authResult = await requireRole(request, [UserRole.ADMIN]);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  // Only admins reach here
  // Delete user, approve withdrawal, etc.
}
```

### Use Case 2: User Accessing Own Resources

```typescript
import { requireAuth } from '@/lib/auth/middleware';
import { canAccessResource, Permission } from '@/lib/auth/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Get order from database
  const order = await prisma.order.findUnique({
    where: { id: params.orderId },
  });

  // Check if user can access this order
  const canAccess = canAccessResource(
    user.role as UserRole,
    order.dropshipperId,
    user.userId,
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_READ_OWN
  );

  if (!canAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ order });
}
```

### Use Case 3: Different Responses Based on Role

```typescript
import { requireAuth } from '@/lib/auth/middleware';
import { hasPermission, Permission } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  const userRole = user.role as UserRole;

  let orders;

  if (hasPermission(userRole, Permission.ORDERS_READ_ALL)) {
    // Admin/Support - get all orders
    orders = await prisma.order.findMany();
  } else if (hasPermission(userRole, Permission.ORDERS_READ_OWN)) {
    // Dropshipper - get only own orders
    orders = await prisma.order.findMany({
      where: { dropshipperId: user.userId },
    });
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ orders });
}
```

---

## Troubleshooting

### Problem: "Redis connection error"

**Solution:**
```bash
# Check if Redis is running
docker-compose ps

# Start Redis
docker-compose up -d redis

# Check Redis connection
redis-cli -h localhost -p 6380 ping
```

### Problem: "Invalid access token"

**Possible causes:**
1. Token expired (24h limit)
2. Token blacklisted (after logout)
3. Wrong JWT_SECRET in environment
4. Token format incorrect (should be "Bearer <token>")

**Solution:**
- Refresh the token using POST /api/auth/refresh
- Check Authorization header format
- Verify JWT_SECRET matches what was used to generate token

### Problem: "User not found"

**Possible causes:**
1. Database not seeded
2. User deleted from database
3. Wrong user ID in token

**Solution:**
```bash
# Re-seed database
npm run db:seed
```

### Problem: "Refresh token has been revoked"

**Possible causes:**
1. User logged out
2. User logged in from another device (single session)
3. Token expired (7d limit)

**Solution:**
- Login again to get new tokens

---

## Production Considerations

### Environment Variables

Update these for production:

```bash
JWT_SECRET="<generate-strong-secret-32-chars>"
JWT_REFRESH_SECRET="<generate-different-strong-secret>"
REDIS_URL="<production-redis-url>"
NODE_ENV="production"
```

Generate strong secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Redis Configuration

For production, use managed Redis:
- **AWS**: ElastiCache
- **Google Cloud**: Memorystore
- **Azure**: Azure Cache for Redis
- **Vercel**: Upstash Redis

### Rate Limiting

Add rate limiting to prevent brute force attacks:
```bash
npm install express-rate-limit
```

### Monitoring

Monitor these metrics:
- Failed login attempts
- Token refresh rate
- Blacklisted tokens count
- Redis connection health

### Security Headers

Add security headers in `next.config.js`:
```javascript
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]
```

---

## Next Features to Add

1. **Rate Limiting**: Prevent brute force attacks on login
2. **Email Verification**: Verify email during registration
3. **Password Reset**: Forgot password flow with email
4. **2FA**: Two-factor authentication with TOTP
5. **OAuth**: Social login (Google, GitHub, etc.)
6. **Audit Logging**: Log all authentication events
7. **Session Management UI**: View/revoke active sessions
8. **Password History**: Prevent password reuse
9. **Account Lockout**: Lock account after N failed attempts
10. **IP Whitelisting**: Restrict admin access by IP

---

## Summary

Stream B successfully implemented a production-ready authentication system with:

- Secure JWT-based authentication
- Comprehensive RBAC with 30+ permissions
- Redis session management with token rotation
- 4 authentication API endpoints
- Global middleware for automatic route protection
- Reusable middleware helpers for custom authorization
- bcrypt password hashing with strength validation
- HttpOnly cookies for refresh tokens
- Token blacklisting for secure logout

The system is ready for immediate use by other development streams and supports all required features for the dropshipping platform MVP.

For detailed implementation information, see `/. claude/epics/dropshipping-platform/updates/2/stream-b.md`.

---

**Ready for integration and feature development!**