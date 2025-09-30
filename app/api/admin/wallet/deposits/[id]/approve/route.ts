import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/middleware';
import { approveDeposit, getDepositRequest } from '@/lib/wallet/deposit';

/**
 * PATCH /api/admin/wallet/deposits/[id]/approve
 * Approve a deposit request (admin only)
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

    // Approve the deposit
    const approvedRequest = await approveDeposit({
      requestId,
      adminUserId: user.userId,
    });

    // Get full request details
    const fullRequest = await getDepositRequest(requestId);

    return NextResponse.json({
      message: 'Deposit request approved successfully',
      request: {
        id: fullRequest.id,
        amount: fullRequest.amount.toFixed(2),
        receiptUrl: fullRequest.receiptUrl,
        observations: fullRequest.observations,
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
    console.error('Approve deposit request error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: error instanceof Error && error.message.includes('not found') ? 404 : 500 }
    );
  }
}