/**
 * Auth configuration and helpers for Next.js API routes
 * This provides a compatibility layer for the support ticket system
 */

import { NextRequest } from 'next/server';
import { verifyAuth } from './middleware';
import { JWTPayload } from './jwt';
import { UserRole } from '@prisma/client';

/**
 * Session type compatible with next-auth
 * This allows the ticket system to work with our JWT-based auth
 */
export interface Session {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

/**
 * Get session from request
 * Emulates next-auth's getServerSession for compatibility
 */
export async function getServerSession(authOptions: any, req?: NextRequest): Promise<Session | null> {
  // If called without request, we can't verify
  if (!req) {
    return null;
  }

  const payload = await verifyAuth(req);

  if (!payload) {
    return null;
  }

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role as UserRole,
    },
  };
}

/**
 * Auth options (placeholder for compatibility)
 * In the future, this can be expanded with actual configuration
 */
export const authOptions = {
  // Placeholder - not used with JWT auth
};