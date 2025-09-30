import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth/jwt';
import { getRefreshToken, rotateRefreshToken } from '@/lib/auth/redis';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token provided' },
        { status: 401 }
      );
    }

    // Verify refresh token
    let userId: string;
    try {
      const payload = verifyRefreshToken(refreshToken);
      userId = payload.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Verify refresh token exists in Redis (not revoked)
    const storedToken = await getRefreshToken(userId);
    if (!storedToken || storedToken !== refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token has been revoked' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { dropshipperProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user account is still active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error: 'Account is not active',
          status: user.status,
        },
        { status: 403 }
      );
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Rotate refresh token in Redis
    await rotateRefreshToken(userId, newRefreshToken, 7 * 24 * 60 * 60);

    // Prepare user response (exclude password hash)
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      dropshipperProfile: user.dropshipperProfile
        ? {
            id: user.dropshipperProfile.id,
            cuit: user.dropshipperProfile.cuit,
            razonSocial: user.dropshipperProfile.razonSocial,
            commissionRate: user.dropshipperProfile.commissionRate.toNumber(),
          }
        : null,
    };

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        accessToken: newAccessToken,
        user: userResponse,
      },
      { status: 200 }
    );

    // Update refresh token cookie
    response.cookies.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}