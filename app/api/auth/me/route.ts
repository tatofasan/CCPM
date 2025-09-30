import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { extractTokenFromHeader, verifyAccessToken } from '@/lib/auth/jwt';
import { isTokenBlacklisted } from '@/lib/auth/redis';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(accessToken);
    if (isBlacklisted) {
      return NextResponse.json(
        { error: 'Token has been revoked' },
        { status: 401 }
      );
    }

    // Verify access token
    let userId: string;
    try {
      const payload = verifyAccessToken(accessToken);
      userId = payload.userId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dropshipperProfile: {
          include: {
            bankAccounts: true,
            shopifyConnections: true,
          },
        },
      },
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
            address: user.dropshipperProfile.address,
            commissionRate: user.dropshipperProfile.commissionRate.toNumber(),
            afipValidatedAt: user.dropshipperProfile.afipValidatedAt,
            createdAt: user.dropshipperProfile.createdAt,
            updatedAt: user.dropshipperProfile.updatedAt,
            bankAccounts: user.dropshipperProfile.bankAccounts.map((account) => ({
              id: account.id,
              cbu: account.cbu,
              alias: account.alias,
              accountHolder: account.accountHolder,
              accountType: account.accountType,
              bankName: account.bankName,
              validatedAt: account.validatedAt,
              createdAt: account.createdAt,
            })),
            shopifyConnections: user.dropshipperProfile.shopifyConnections.map((conn) => ({
              id: conn.id,
              shopDomain: conn.shopDomain,
              status: conn.status,
              lastSyncAt: conn.lastSyncAt,
              createdAt: conn.createdAt,
            })),
          }
        : null,
    };

    return NextResponse.json(
      {
        success: true,
        user: userResponse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}