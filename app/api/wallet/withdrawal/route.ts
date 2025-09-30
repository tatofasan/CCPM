import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import {
  createWithdrawalRequest,
  listWithdrawalRequests,
  getWithdrawalStats,
  WITHDRAWAL_MIN_AMOUNT,
  WITHDRAWAL_MAX_AMOUNT,
} from '@/lib/wallet/withdrawal';
import { z } from 'zod';

/**
 * POST /api/wallet/withdrawal
 * Create a new withdrawal request
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json();
    const schema = z.object({
      amount: z
        .number()
        .positive('Amount must be greater than 0')
        .min(
          WITHDRAWAL_MIN_AMOUNT,
          `Amount must be at least ${WITHDRAWAL_MIN_AMOUNT}`
        )
        .max(
          WITHDRAWAL_MAX_AMOUNT,
          `Amount cannot exceed ${WITHDRAWAL_MAX_AMOUNT}`
        ),
      bankAccountId: z.string().min(1, 'Bank account ID is required'),
    });

    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { amount, bankAccountId } = validation.data;

    // Create withdrawal request
    const withdrawalRequest = await createWithdrawalRequest({
      dropshipperId: dropshipperProfile.id,
      amount,
      bankAccountId,
    });

    return NextResponse.json(
      {
        message: 'Withdrawal request created successfully',
        request: {
          id: withdrawalRequest.id,
          amount: withdrawalRequest.amount.toFixed(2),
          bankAccountId: withdrawalRequest.bankAccountId,
          status: withdrawalRequest.status,
          createdAt: withdrawalRequest.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create withdrawal request error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: error instanceof Error && error.message.includes('Insufficient') ? 400 : 500 }
    );
  }
}

/**
 * GET /api/wallet/withdrawal
 * List withdrawal requests for the authenticated dropshipper
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate query parameters
    const querySchema = z.object({
      page: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().max(100).default(20),
      status: z
        .enum(['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'])
        .optional()
        .nullable(),
      startDate: z.string().datetime().optional().nullable(),
      endDate: z.string().datetime().optional().nullable(),
    });

    const queryValidation = querySchema.safeParse({
      page,
      pageSize,
      status,
      startDate,
      endDate,
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryValidation.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedQuery = queryValidation.data;

    // Get withdrawal requests
    const result = await listWithdrawalRequests({
      dropshipperId: dropshipperProfile.id,
      status: validatedQuery.status || undefined,
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize,
      startDate: validatedQuery.startDate
        ? new Date(validatedQuery.startDate)
        : undefined,
      endDate: validatedQuery.endDate
        ? new Date(validatedQuery.endDate)
        : undefined,
    });

    // Get stats
    const stats = await getWithdrawalStats(dropshipperProfile.id);

    return NextResponse.json({
      requests: result.requests.map((req) => ({
        id: req.id,
        amount: req.amount.toFixed(2),
        status: req.status,
        reviewedByUserId: req.reviewedByUserId,
        reviewedAt: req.reviewedAt,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
        bankAccount: {
          id: req.bankAccount.id,
          cbu: req.bankAccount.cbu,
          alias: req.bankAccount.alias,
          accountHolder: req.bankAccount.accountHolder,
          bankName: req.bankAccount.bankName,
        },
        reviewedBy: req.reviewedBy
          ? {
              id: req.reviewedBy.id,
              email: req.reviewedBy.email,
              role: req.reviewedBy.role,
            }
          : null,
      })),
      pagination: result.pagination,
      stats: {
        totalRequests: stats.totalRequests,
        pendingRequests: stats.pendingRequests,
        approvedRequests: stats.approvedRequests,
        rejectedRequests: stats.rejectedRequests,
        completedRequests: stats.completedRequests,
        totalCompletedAmount: stats.totalCompletedAmount.toFixed(2),
        totalPendingAmount: stats.totalPendingAmount.toFixed(2),
      },
      limits: {
        minAmount: WITHDRAWAL_MIN_AMOUNT,
        maxAmount: WITHDRAWAL_MAX_AMOUNT,
      },
    });
  } catch (error) {
    console.error('List withdrawal requests error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}