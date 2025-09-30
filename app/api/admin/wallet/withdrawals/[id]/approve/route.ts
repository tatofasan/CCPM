import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import {
  approveWithdrawal,
  getWithdrawalRequest,
} from '@/lib/wallet/withdrawal';

/**
 * PATCH /api/admin/wallet/withdrawals/[id]/approve
 * Approve a withdrawal request (admin only)
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

    // Approve the withdrawal
    await approveWithdrawal({
      requestId,
      adminUserId: user.userId,
    });

    // Get full request details
    const fullRequest = await getWithdrawalRequest(requestId);

    return NextResponse.json({
      message: 'Withdrawal request approved successfully',
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
    console.error('Approve withdrawal request error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      {
        status:
          error instanceof Error
            ? error.message.includes('not found')
              ? 404
              : error.message.includes('Insufficient')
              ? 400
              : 500
            : 500,
      }
    );
  }
}