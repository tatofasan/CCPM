import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getTransactionHistory } from '@/lib/wallet/transaction';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';
import { z } from 'zod';

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  type: z.nativeEnum(TransactionType).optional(),
  orderId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/**
 * GET /api/wallet/transactions
 * Get transaction history for the authenticated user
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 20, max: 100)
 * - type: Filter by transaction type
 * - orderId: Filter by order ID
 * - startDate: Filter by start date (ISO 8601)
 * - endDate: Filter by end date (ISO 8601)
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
      where: { userId: user.userId },
      select: { id: true },
    });

    if (!dropshipperProfile) {
      return NextResponse.json(
        { error: 'Dropshipper profile not found' },
        { status: 404 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      type: searchParams.get('type'),
      orderId: searchParams.get('orderId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    };

    const validationResult = querySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const { page, pageSize, type, orderId, startDate, endDate } =
      validationResult.data;

    // Get transaction history
    const result = await getTransactionHistory(dropshipperProfile.id, {
      page,
      pageSize,
      type,
      orderId,
      startDate,
      endDate,
    });

    // Format transactions for response
    const transactions = result.transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      debitAmount: tx.debitAmount.toFixed(2),
      creditAmount: tx.creditAmount.toFixed(2),
      balanceAfter: tx.balanceAfter.toFixed(2),
      description: tx.description,
      orderId: tx.orderId,
      order: tx.order
        ? {
            id: tx.order.id,
            customerName: tx.order.customerName,
            totalAmount: tx.order.totalAmount.toFixed(2),
            state: tx.order.state,
          }
        : null,
      createdBy: {
        id: tx.createdBy.id,
        email: tx.createdBy.email,
        role: tx.createdBy.role,
      },
      createdAt: tx.createdAt.toISOString(),
    }));

    return NextResponse.json({
      transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}