---
stream: Stream B - Authentication System (JWT + RBAC)
issue: 2
status: completed
started: 2025-09-30T14:00:00Z
completed: 2025-09-30T15:30:00Z
---

# Stream B Progress: Authentication System (JWT + RBAC)

## Status: COMPLETED

## Summary
Successfully implemented complete JWT-based authentication system with RBAC (Role-Based Access Control), including token generation/validation, password hashing, session management with Redis, and comprehensive middleware for route protection.

## Completed Tasks

### 1. Dependencies Installation
- Installed `jsonwebtoken` for JWT token generation and validation
- Installed `ioredis` for Redis session management
- Installed TypeScript type definitions (`@types/jsonwebtoken`, `@types/ioredis`)

### 2. JWT Utilities (`/lib/auth/jwt.ts`)
Implemented complete JWT token management:
- `generateAccessToken(user)` - Generate 24h access tokens
- `generateRefreshToken(user)` - Generate 7d refresh tokens
- `verifyAccessToken(token)` - Verify and decode access tokens
- `verifyRefreshToken(token)` - Verify and decode refresh tokens
- `extractTokenFromHeader(authHeader)` - Extract Bearer token from Authorization header

**Token Structure:**
```typescript
{
  userId: string;
  email: string;
  role: string; // ADMIN | DROPSHIPPER | SUPPORT
  status: string; // ACTIVE | SUSPENDED | INACTIVE
  iat: number; // issued at
  exp: number; // expiration
  iss: 'dropshipping-platform';
  aud: 'dropshipping-api';
}
```

### 3. Password Hashing (`/lib/auth/password.ts`)
Implemented bcrypt-based password security:
- `hashPassword(password)` - Hash passwords with bcrypt (cost factor 12)
- `comparePassword(password, hashedPassword)` - Verify passwords
- `validatePasswordStrength(password)` - Password strength validation
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number

### 4. RBAC System (`/lib/auth/rbac.ts`)
Implemented comprehensive permission-based access control:

**Permissions Defined:**
- User management: `users:read`, `users:write`, `users:delete`
- Orders: `orders:read:all`, `orders:read:own`, `orders:write`, `orders:update_state`, `orders:cancel`
- Products: `products:read`, `products:write`, `products:delete`
- Wallet: `wallet:read:all`, `wallet:read:own`, `wallet:approve_deposit`, `wallet:approve_withdrawal`, `wallet:request_deposit`, `wallet:request_withdrawal`
- Suppliers: `suppliers:read`, `suppliers:write`, `suppliers:delete`
- Shopify: `shopify:read:own`, `shopify:write:own`, `shopify:read:all`
- Profile: `profile:read:own`, `profile:write:own`, `profile:read:all`, `profile:write:all`
- Bank accounts: `bank_accounts:read:own`, `bank_accounts:write:own`, `bank_accounts:read:all`
- Analytics: `analytics:read`, `reports:read`

**Role-Permission Mappings:**
- **ADMIN**: Full access to all resources
- **DROPSHIPPER**: Access to own orders, products catalog, own wallet, own Shopify connections
- **SUPPORT**: Read-only access for customer support

**Functions:**
- `hasPermission(role, permission)` - Check if role has permission
- `hasAnyPermission(role, permissions)` - Check if role has any of the permissions
- `hasAllPermissions(role, permissions)` - Check if role has all permissions
- `getRolePermissions(role)` - Get all permissions for a role
- `canAccessResource(role, resourceOwnerId, currentUserId, readPermission, readOwnPermission)` - Check resource access
- Sub-roles support for granular control (admin:super, admin:finance, support:l1, etc.)

### 5. Redis Session Management (`/lib/auth/redis.ts`)
Implemented Redis-based session management:
- `getRedisClient()` - Get or create Redis client with retry logic
- `storeRefreshToken(userId, token, expiresInSeconds)` - Store refresh token (7d TTL)
- `getRefreshToken(userId)` - Retrieve refresh token
- `deleteRefreshToken(userId)` - Remove refresh token (logout)
- `blacklistToken(token, expiresInSeconds)` - Blacklist access token
- `isTokenBlacklisted(token)` - Check if token is blacklisted
- `rotateRefreshToken(userId, newToken, expiresInSeconds)` - Rotate refresh token
- `storeSessionData(userId, data, expiresInSeconds)` - Store additional session data
- `getSessionData(userId)` - Retrieve session data
- `deleteSessionData(userId)` - Remove session data
- `closeRedisConnection()` - Graceful shutdown

### 6. Authentication API Endpoints

#### POST `/api/auth/login`
- Validates email/password credentials
- Checks user account status (must be ACTIVE)
- Generates access token (24h) and refresh token (7d)
- Stores refresh token in Redis
- Sets HttpOnly cookie for refresh token
- Returns access token and user info

**Request:**
```json
{
  "email": "user@example.com",
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
    "email": "user@example.com",
    "role": "DROPSHIPPER",
    "status": "ACTIVE",
    "dropshipperProfile": { ... }
  }
}
```

#### POST `/api/auth/logout`
- Extracts access token from Authorization header
- Blacklists access token
- Deletes refresh token from Redis
- Clears refresh token cookie
- Returns success message

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

#### POST `/api/auth/refresh`
- Extracts refresh token from HttpOnly cookie
- Verifies refresh token signature and Redis storage
- Checks user account status
- Generates new access token and refresh token
- Rotates refresh token in Redis
- Updates refresh token cookie
- Returns new access token and user info

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

#### GET `/api/auth/me`
- Extracts access token from Authorization header
- Checks if token is blacklisted
- Verifies access token
- Fetches user from database with full profile
- Returns user info including dropshipper profile, bank accounts, Shopify connections

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
    "email": "user@example.com",
    "role": "DROPSHIPPER",
    "status": "ACTIVE",
    "dropshipperProfile": {
      "id": "clxyz456",
      "cuit": "20-12345678-9",
      "razonSocial": "My Company",
      "commissionRate": 15.00,
      "bankAccounts": [...],
      "shopifyConnections": [...]
    }
  }
}
```

### 7. Auth Middleware (`/lib/auth/middleware.ts`)
Implemented reusable middleware functions:
- `verifyAuth(request)` - Verify JWT and return user payload
- `requireAuth(request)` - Require authentication (401 if not authenticated)
- `requireRole(request, allowedRoles)` - Require specific role(s)
- `requirePermission(request, permission)` - Require specific permission
- `requireAnyPermission(request, permissions)` - Require any of the permissions
- `isAuthenticated(request)` - Check if authenticated (boolean)
- `hasRole(request, role)` - Check if user has role (boolean)
- `isAdmin(request)` - Check if user is admin (boolean)
- `isDropshipper(request)` - Check if user is dropshipper (boolean)

### 8. Global Middleware (`/middleware.ts`)
Implemented Next.js middleware for route protection:
- Public routes: `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`
- Public API routes: `/api/auth/login`, `/api/auth/refresh`, `/api/auth/register`
- Protected routes: `/dashboard`, `/orders`, `/products`, `/wallet`, `/settings`, `/profile`
- Protected API routes: `/api/auth/logout`, `/api/auth/me`, `/api/orders`, `/api/products`, `/api/wallet`

**Features:**
- Automatic authentication verification for protected routes
- Redirects unauthenticated users to `/login` with redirect parameter
- Returns 401 for unauthenticated API requests
- Checks user account status (must be ACTIVE)
- Adds user info to request headers (`x-user-id`, `x-user-email`, `x-user-role`)
- Skips middleware for static files and Next.js internals

## Files Created

### Core Authentication
- `/lib/auth/jwt.ts` - JWT token utilities (115 lines)
- `/lib/auth/password.ts` - Password hashing utilities (55 lines)
- `/lib/auth/rbac.ts` - RBAC system with permissions (260 lines)
- `/lib/auth/redis.ts` - Redis session management (140 lines)
- `/lib/auth/middleware.ts` - Auth middleware helpers (180 lines)

### API Endpoints
- `/app/api/auth/login/route.ts` - Login endpoint (115 lines)
- `/app/api/auth/logout/route.ts` - Logout endpoint (60 lines)
- `/app/api/auth/refresh/route.ts` - Token refresh endpoint (120 lines)
- `/app/api/auth/me/route.ts` - Get current user endpoint (115 lines)

### Middleware
- `/middleware.ts` - Global Next.js middleware (125 lines)

### Documentation
- `/.claude/epics/dropshipping-platform/updates/2/stream-b.md` - This file
- `/STREAM_B_SUMMARY.md` - Usage documentation (created next)

## Environment Variables

All required environment variables are configured in `.env`:
```bash
JWT_SECRET="dev-jwt-secret-change-in-production-at-least-32-chars"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production-at-least-32-chars"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"
REDIS_URL="redis://localhost:6380"
```

## Test Credentials

From seed data (Stream A):
- **Admin**: admin@dropshipping.com / password123
- **Dropshipper 1**: dropshipper1@example.com / password123
- **Dropshipper 2**: dropshipper2@example.com / password123

## Key Design Decisions

1. **JWT Storage**: Access tokens sent in Authorization header, refresh tokens in HttpOnly cookies
2. **Token Expiration**: 24h for access tokens, 7d for refresh tokens
3. **Token Rotation**: Refresh tokens are rotated on each refresh request
4. **Token Blacklist**: Access tokens are blacklisted on logout (stored in Redis until expiration)
5. **Password Hashing**: bcrypt with cost factor 12 for security
6. **RBAC**: Permission-based access control for fine-grained authorization
7. **Session Management**: Redis for fast token storage and blacklisting
8. **Error Messages**: Generic "Invalid credentials" to prevent email enumeration
9. **Account Status**: Users must have ACTIVE status to authenticate
10. **Middleware**: Global middleware for automatic route protection

## Security Features

1. **JWT Signing**: Separate secrets for access and refresh tokens
2. **Token Verification**: Issuer and audience validation
3. **Token Blacklisting**: Prevents use of tokens after logout
4. **Token Rotation**: Reduces risk of token theft
5. **HttpOnly Cookies**: Prevents XSS attacks on refresh tokens
6. **Password Hashing**: bcrypt with high cost factor
7. **Password Strength Validation**: Enforces strong passwords
8. **Account Status Checks**: Suspended accounts cannot authenticate
9. **Redis TTL**: Automatic cleanup of expired tokens
10. **Error Handling**: Safe error messages without exposing sensitive info

## How Other Agents Can Use Auth

### Example: Protected API Endpoint

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  // Require specific permission
  const authResult = await requirePermission(
    request,
    Permission.ORDERS_READ_ALL
  );

  // If NextResponse, user is not authorized
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Use user.userId, user.role, etc.
  // ... your endpoint logic
}
```

### Example: Get User from Headers

```typescript
export async function POST(request: NextRequest) {
  // User info is available in headers (set by middleware)
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role');

  // ... your endpoint logic
}
```

### Example: Check Multiple Permissions

```typescript
import { requireAnyPermission } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/rbac';

export async function GET(request: NextRequest) {
  // User needs either read:all or read:own permission
  const authResult = await requireAnyPermission(request, [
    Permission.ORDERS_READ_ALL,
    Permission.ORDERS_READ_OWN,
  ]);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // Check if user can only see own orders
  const canSeeAll = hasPermission(
    user.role as UserRole,
    Permission.ORDERS_READ_ALL
  );

  // Filter data accordingly
}
```

## Testing the Auth System

### 1. Start Redis
```bash
docker-compose up -d
```

### 2. Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dropshipping.com","password":"password123"}'
```

### 3. Test Protected Endpoint
```bash
# Save access token from login response
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 4. Test Logout
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 5. Test Token Refresh
```bash
# Refresh token is in cookie (sent automatically by browser)
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refreshToken=<refresh_token_from_login>"
```

## Notes for Other Streams

### Stream C (Next.js Setup)
- Global middleware is ready for route protection
- Auth endpoints can be used for login/logout UI flows
- User info available in request headers for server components

### Stream D (CI/CD)
- Ensure Redis is available in CI/CD pipeline
- Set production JWT secrets in environment variables
- Consider using managed Redis (AWS ElastiCache, Redis Cloud)

### Future Features
- Rate limiting for login attempts (brute force protection)
- Email verification during registration
- Password reset flow
- Two-factor authentication (2FA)
- OAuth integration (Google, GitHub, etc.)
- Audit logging for authentication events
- Session management UI (view active sessions, revoke sessions)

## Known Limitations

1. **Single Refresh Token**: Each user can only have one active refresh token (new login invalidates old sessions)
2. **No Rate Limiting**: Login endpoint should have rate limiting in production
3. **No Email Verification**: Users can login immediately after registration
4. **No Password Reset**: Password reset flow not implemented yet
5. **No 2FA**: Two-factor authentication not implemented yet

## Next Steps

This stream is complete. Authentication system is production-ready for the MVP with:
- Secure JWT-based authentication
- Comprehensive RBAC system
- Session management with Redis
- Global middleware for route protection
- Complete API endpoints for auth flows

Ready for integration with other streams and feature development!

## Commit History

All changes committed with format: `Issue #2: {specific change}`

Ready for review and integration testing!