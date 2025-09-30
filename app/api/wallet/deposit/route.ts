import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import {
  createDepositRequest,
  listDepositRequests,
  getDepositStats,
} from '@/lib/wallet/deposit';
import { z } from 'zod';

/**
 * POST /api/wallet/deposit
 * Create a new deposit request
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
      amount: z.number().positive('Amount must be greater than 0'),
      receiptUrl: z.string().url('Invalid receipt URL').optional(),
      observations: z.string().max(500, 'Observations too long').optional(),
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

    const { amount, receiptUrl, observations } = validation.data;

    // Create deposit request
    const depositRequest = await createDepositRequest({
      dropshipperId: dropshipperProfile.id,
      amount,
      receiptUrl,
      observations,
    });

    return NextResponse.json(
      {
        message: 'Deposit request created successfully',
        request: {
          id: depositRequest.id,
          amount: depositRequest.amount.toFixed(2),
          receiptUrl: depositRequest.receiptUrl,
          observations: depositRequest.observations,
          status: depositRequest.status,
          createdAt: depositRequest.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create deposit request error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/wallet/deposit
 * List deposit requests for the authenticated dropshipper
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
        .enum(['PENDING', 'APPROVED', 'REJECTED'])
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

    // Get deposit requests
    const result = await listDepositRequests({
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
    const stats = await getDepositStats(dropshipperProfile.id);

    return NextResponse.json({
      requests: result.requests.map((req) => ({
        id: req.id,
        amount: req.amount.toFixed(2),
        receiptUrl: req.receiptUrl,
        observations: req.observations,
        status: req.status,
        reviewedByUserId: req.reviewedByUserId,
        reviewedAt: req.reviewedAt,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
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
        totalApprovedAmount: stats.totalApprovedAmount.toFixed(2),
      },
    });
  } catch (error) {
    console.error('List deposit requests error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}