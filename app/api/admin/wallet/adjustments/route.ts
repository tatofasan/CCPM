import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import {
  createManualAdjustment,
  getManualAdjustmentSummary,
  validateManualAdjustment,
} from '@/lib/wallet/manual-adjustment';
import { z } from 'zod';

/**
 * POST /api/admin/wallet/adjustments
 * Create a manual wallet adjustment (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await requireRole(request, ['ADMIN']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;

    // Parse and validate request body
    const body = await request.json();
    const schema = z.object({
      dropshipperId: z.string().min(1, 'Dropshipper ID is required'),
      amount: z.number().positive('Amount must be greater than 0'),
      type: z.enum(['CREDIT', 'DEBIT'], {
        errorMap: () => ({ message: 'Type must be CREDIT or DEBIT' }),
      }),
      reason: z
        .string()
        .min(10, 'Reason must be at least 10 characters')
        .max(500, 'Reason must not exceed 500 characters'),
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

    const { dropshipperId, amount, type, reason } = validation.data;

    // Verify dropshipper exists
    const dropshipper = await prisma.dropshipperProfile.findUnique({
      where: { id: dropshipperId },
      select: { id: true, razonSocial: true },
    });

    if (!dropshipper) {
      return NextResponse.json(
        { error: 'Dropshipper not found' },
        { status: 404 }
      );
    }

    // Validate the adjustment
    try {
      validateManualAdjustment({
        dropshipperId,
        amount,
        type,
        reason,
        adminUserId: user.userId,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Validation failed',
        },
        { status: 400 }
      );
    }

    // Create the manual adjustment
    const adjustment = await createManualAdjustment({
      dropshipperId,
      amount,
      type,
      reason,
      adminUserId: user.userId,
    });

    return NextResponse.json(
      {
        message: 'Manual adjustment created successfully',
        adjustment: {
          id: adjustment.id,
          dropshipperId: adjustment.dropshipperId,
          type: adjustment.type,
          debitAmount: adjustment.debitAmount.toFixed(2),
          creditAmount: adjustment.creditAmount.toFixed(2),
          balanceAfter: adjustment.balanceAfter.toFixed(2),
          description: adjustment.description,
          createdByUserId: adjustment.createdByUserId,
          createdAt: adjustment.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create manual adjustment error:', error);
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
 * GET /api/admin/wallet/adjustments
 * Get manual adjustments summary (admin only)
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
    const dropshipperId = searchParams.get('dropshipperId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate query parameters
    const querySchema = z.object({
      dropshipperId: z.string().optional().nullable(),
      startDate: z.string().datetime().optional().nullable(),
      endDate: z.string().datetime().optional().nullable(),
    });

    const queryValidation = querySchema.safeParse({
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

    if (!validatedQuery.dropshipperId) {
      return NextResponse.json(
        { error: 'Dropshipper ID is required' },
        { status: 400 }
      );
    }

    // Get adjustment summary
    const summary = await getManualAdjustmentSummary(
      validatedQuery.dropshipperId,
      validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined
    );

    return NextResponse.json({
      adjustments: summary.adjustments.map((adj) => ({
        id: adj.id,
        type: adj.type,
        debitAmount: adj.debitAmount.toFixed(2),
        creditAmount: adj.creditAmount.toFixed(2),
        balanceAfter: adj.balanceAfter.toFixed(2),
        description: adj.description,
        createdAt: adj.createdAt,
        createdBy: {
          id: adj.createdBy.id,
          email: adj.createdBy.email,
          role: adj.createdBy.role,
        },
      })),
      summary: {
        totalCount: summary.summary.totalCount,
        totalCredits: summary.summary.totalCredits.toFixed(2),
        totalDebits: summary.summary.totalDebits.toFixed(2),
        netAdjustment: summary.summary.netAdjustment.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Get manual adjustments error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}