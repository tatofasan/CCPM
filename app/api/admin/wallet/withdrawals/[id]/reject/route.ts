import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import {
  rejectWithdrawal,
  getWithdrawalRequest,
} from '@/lib/wallet/withdrawal';
import { z } from 'zod';

/**
 * PATCH /api/admin/wallet/withdrawals/[id]/reject
 * Reject a withdrawal request (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await requireRole(request, ['ADMIN']);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const requestId = params.id;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const schema = z.object({
      reason: z
        .string()
        .min(10, 'Rejection reason must be at least 10 characters')
        .max(500, 'Rejection reason must not exceed 500 characters'),
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

    const { reason } = validation.data;

    // Reject the withdrawal
    await rejectWithdrawal({
      requestId,
      adminUserId: user.userId,
      reason,
    });

    // Get full request details
    const fullRequest = await getWithdrawalRequest(requestId);

    return NextResponse.json({
      message: 'Withdrawal request rejected successfully',
      request: {
        id: fullRequest.id,
        amount: fullRequest.amount.toFixed(2),
        status: fullRequest.status,
        reviewedByUserId: fullRequest.reviewedByUserId,
        reviewedAt: fullRequest.reviewedAt,
        createdAt: fullRequest.createdAt,
        updatedAt: fullRequest.updatedAt,
        dropshipper: {
          id: fullRequest.dropshipper.id,
          razonSocial: fullRequest.dropshipper.razonSocial,
          cuit: fullRequest.dropshipper.cuit,
          email: fullRequest.dropshipper.user.email,
        },
        bankAccount: {
          id: fullRequest.bankAccount.id,
          cbu: fullRequest.bankAccount.cbu,
          alias: fullRequest.bankAccount.alias,
          accountHolder: fullRequest.bankAccount.accountHolder,
          bankName: fullRequest.bankAccount.bankName,
          accountType: fullRequest.bankAccount.accountType,
        },
        reviewedBy: fullRequest.reviewedBy
          ? {
              id: fullRequest.reviewedBy.id,
              email: fullRequest.reviewedBy.email,
              role: fullRequest.reviewedBy.role,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Reject withdrawal request error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}