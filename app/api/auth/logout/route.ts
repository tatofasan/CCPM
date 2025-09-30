import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyAccessToken } from '@/lib/auth/jwt';
import { deleteRefreshToken, blacklistToken } from '@/lib/auth/redis';

export async function POST(request: NextRequest) {
  try {
    // Extract access token from Authorization header
    const authHeader = request.headers.get('authorization');
    const accessToken = extractTokenFromHeader(authHeader);

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No access token provided' },
        { status: 401 }
      );
    }

    // Verify access token and get user ID
    let userId: string;
    try {
      const payload = verifyAccessToken(accessToken);
      userId = payload.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Blacklist the access token (remaining TTL ~24h)
    await blacklistToken(accessToken, 24 * 60 * 60);

    // Delete refresh token from Redis
    await deleteRefreshToken(userId);

    // Create response
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear refresh token cookie
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}