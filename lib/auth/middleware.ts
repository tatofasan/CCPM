import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyAccessToken, JWTPayload } from './jwt';
import { isTokenBlacklisted } from './redis';
import { UserRole } from '@prisma/client';
import { hasPermission, Permission } from './rbac';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

/**
 * Middleware to verify JWT token and attach user to request
 * Returns user payload if authenticated, null otherwise
 */
export async function verifyAuth(request: NextRequest): Promise<JWTPayload | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return null;
    }

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return null;
    }

    // Verify and decode token
    const payload = verifyAccessToken(token);

    return payload;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

/**
 * Middleware to require authentication
 * Returns 401 if not authenticated
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return { user };
}

/**
 * Middleware to require specific role(s)
 * Returns 401 if not authenticated, 403 if not authorized
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: JWTPayload } | NextResponse> {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  if (!allowedRoles.includes(user.role as UserRole)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Middleware to require specific permission(s)
 * Returns 401 if not authenticated, 403 if not authorized
 */
export async function requirePermission(
  request: NextRequest,
  requiredPermission: Permission
): Promise<{ user: JWTPayload } | NextResponse> {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const userRole = user.role as UserRole;

  if (!hasPermission(userRole, requiredPermission)) {
    return NextResponse.json(
      {
        error: 'Insufficient permissions',
        required: requiredPermission,
      },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Middleware to require any of the specified permissions
 * Returns 401 if not authenticated, 403 if not authorized
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: Permission[]
): Promise<{ user: JWTPayload } | NextResponse> {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const userRole = user.role as UserRole;
  const hasAnyPerm = permissions.some((permission) =>
    hasPermission(userRole, permission)
  );

  if (!hasAnyPerm) {
    return NextResponse.json(
      {
        error: 'Insufficient permissions',
        required: permissions,
      },
      { status: 403 }
    );
  }

  return { user };
}

/**
 * Check if user is authenticated (returns boolean, doesn't throw)
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const user = await verifyAuth(request);
  return user !== null;
}

/**
 * Check if user has a specific role (returns boolean, doesn't throw)
 */
export async function hasRole(request: NextRequest, role: UserRole): Promise<boolean> {
  const user = await verifyAuth(request);
  return user !== null && user.role === role;
}

/**
 * Check if user is admin (returns boolean, doesn't throw)
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  return hasRole(request, 'ADMIN');
}

/**
 * Check if user is dropshipper (returns boolean, doesn't throw)
 */
export async function isDropshipper(request: NextRequest): Promise<boolean> {
  return hasRole(request, 'DROPSHIPPER');
}