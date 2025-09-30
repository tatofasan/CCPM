import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { comparePassword } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import { storeRefreshToken } from '@/lib/auth/redis';
import { z } from 'zod';

const prisma = new PrismaClient();

// Request validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { dropshipperProfile: true },
    });

    if (!user) {
      // Use generic error message to prevent email enumeration
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user account is active
    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error: 'Account is not active',
          status: user.status,
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in Redis (7 days)
    await storeRefreshToken(user.id, refreshToken, 7 * 24 * 60 * 60);

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

    // Create response with HttpOnly cookie for refresh token
    const response = NextResponse.json(
      {
        success: true,
        accessToken,
        user: userResponse,
      },
      { status: 200 }
    );

    // Set refresh token as HttpOnly cookie
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}