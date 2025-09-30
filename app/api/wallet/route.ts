import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getBalance, getTransactionStats } from '@/lib/wallet/balance';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/wallet
 * Get wallet balance indicators for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Get dropshipper profile
    const dropshipperProfile = await prisma.dropshipperProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!dropshipperProfile) {
      return NextResponse.json(
        { error: 'Dropshipper profile not found' },
        { status: 404 }
      );
    }

    // Get balance indicators
    const balance = await getBalance(dropshipperProfile.id);

    // Get transaction stats
    const stats = await getTransactionStats(dropshipperProfile.id);

    return NextResponse.json({
      balance: {
        available: balance.available.toFixed(2),
        withdrawable: balance.withdrawable.toFixed(2),
        projected: balance.projected.toFixed(2),
      },
      stats: {
        totalCredits: stats.totalCredits.toFixed(2),
        totalDebits: stats.totalDebits.toFixed(2),
        totalTransactions: stats.totalTransactions,
        transactionsByType: stats.transactionsByType,
      },
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}