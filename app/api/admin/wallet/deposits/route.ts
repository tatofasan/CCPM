import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { listDepositRequests, getDepositStats } from '@/lib/wallet/deposit';
import { z } from 'zod';

/**
 * GET /api/admin/wallet/deposits
 * List all deposit requests (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireRole(request, ['ADMIN', 'SUPPORT']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const status = searchParams.get('status');
    const dropshipperId = searchParams.get('dropshipperId');
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
      dropshipperId: z.string().optional().nullable(),
      startDate: z.string().datetime().optional().nullable(),
      endDate: z.string().datetime().optional().nullable(),
    });

    const queryValidation = querySchema.safeParse({
      page,
      pageSize,
      status,
      dropshipperId,
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
      dropshipperId: validatedQuery.dropshipperId || undefined,
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

    // Get overall stats
    const stats = await getDepositStats();

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
        dropshipper: {
          id: req.dropshipper.id,
          razonSocial: req.dropshipper.razonSocial,
          cuit: req.dropshipper.cuit,
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
        totalApprovedAmount: stats.totalApprovedAmount.toFixed(2),
      },
    });
  } catch (error) {
    console.error('List deposit requests (admin) error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}