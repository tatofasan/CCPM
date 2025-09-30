import { prisma } from '@/lib/prisma';
import { WithdrawalStatus, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createTransaction } from './transaction';
import { validateWithdrawableBalance } from './balance';

// Configurable withdrawal limits
export const WITHDRAWAL_MIN_AMOUNT = 1000; // $1,000 minimum
export const WITHDRAWAL_MAX_AMOUNT = 100000; // $100,000 maximum

export interface CreateWithdrawalRequestParams {
  dropshipperId: string;
  amount: number | Decimal;
  bankAccountId: string;
}

export interface WithdrawalRequestResult {
  id: string;
  dropshipperId: string;
  amount: Decimal;
  bankAccountId: string;
  status: WithdrawalStatus;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApproveWithdrawalParams {
  requestId: string;
  adminUserId: string;
}

export interface RejectWithdrawalParams {
  requestId: string;
  adminUserId: string;
  reason: string;
}

export interface ListWithdrawalRequestsParams {
  dropshipperId?: string;
  status?: WithdrawalStatus;
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Creates a new withdrawal request
 * Validates balance and amount limits before creating the request
 *
 * @param params - Withdrawal request parameters
 * @returns The created withdrawal request
 * @throws Error if validation fails
 */
export async function createWithdrawalRequest(
  params: CreateWithdrawalRequestParams
): Promise<WithdrawalRequestResult> {
  const { dropshipperId, amount, bankAccountId } = params;

  // Validate amount
  const withdrawalAmount = new Decimal(amount);
  if (withdrawalAmount.lessThanOrEqualTo(0)) {
    throw new Error('Withdrawal amount must be greater than 0');
  }

  // Check minimum amount
  if (withdrawalAmount.lessThan(WITHDRAWAL_MIN_AMOUNT)) {
    throw new Error(
      `Withdrawal amount must be at least $${WITHDRAWAL_MIN_AMOUNT.toLocaleString()}`
    );
  }

  // Check maximum amount
  if (withdrawalAmount.greaterThan(WITHDRAWAL_MAX_AMOUNT)) {
    throw new Error(
      `Withdrawal amount cannot exceed $${WITHDRAWAL_MAX_AMOUNT.toLocaleString()}`
    );
  }

  // Validate withdrawable balance
  const hasBalance = await validateWithdrawableBalance(
    dropshipperId,
    withdrawalAmount
  );

  if (!hasBalance) {
    throw new Error(
      'Insufficient withdrawable balance. Consider pending withdrawals and transactions.'
    );
  }

  // Verify bank account exists and belongs to dropshipper
  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
  });

  if (!bankAccount) {
    throw new Error('Bank account not found');
  }

  if (bankAccount.dropshipperId !== dropshipperId) {
    throw new Error('Bank account does not belong to this dropshipper');
  }

  // Create withdrawal request
  const withdrawalRequest = await prisma.withdrawalRequest.create({
    data: {
      dropshipperId,
      amount: withdrawalAmount,
      bankAccountId,
      status: WithdrawalStatus.PENDING,
    },
  });

  return withdrawalRequest;
}

/**
 * Approves a withdrawal request and creates a WITHDRAWAL transaction
 * This debits the dropshipper's wallet balance
 *
 * @param params - Approval parameters
 * @returns The approved withdrawal request
 * @throws Error if request not found, already processed, or transaction fails
 */
export async function approveWithdrawal(
  params: ApproveWithdrawalParams
): Promise<WithdrawalRequestResult> {
  const { requestId, adminUserId } = params;

  // Get the withdrawal request
  const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
  });

  if (!withdrawalRequest) {
    throw new Error('Withdrawal request not found');
  }

  if (withdrawalRequest.status !== WithdrawalStatus.PENDING) {
    throw new Error(
      `Withdrawal request is already ${withdrawalRequest.status.toLowerCase()}`
    );
  }

  // Validate withdrawable balance again (in case balance changed)
  const hasBalance = await validateWithdrawableBalance(
    withdrawalRequest.dropshipperId,
    withdrawalRequest.amount
  );

  if (!hasBalance) {
    throw new Error(
      'Insufficient withdrawable balance at approval time. Balance may have changed since request.'
    );
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update withdrawal request status
    const updatedRequest = await tx.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: WithdrawalStatus.APPROVED,
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
      },
    });

    // Create WITHDRAWAL transaction to debit wallet
    await createTransaction({
      dropshipperId: withdrawalRequest.dropshipperId,
      type: TransactionType.WITHDRAWAL,
      debitAmount: withdrawalRequest.amount,
      description: `Withdrawal approved - Request #${requestId}`,
      createdByUserId: adminUserId,
    });

    return updatedRequest;
  });

  return result;
}

/**
 * Rejects a withdrawal request
 * The request is marked as rejected with a reason
 *
 * @param params - Rejection parameters
 * @returns The rejected withdrawal request
 * @throws Error if request not found or already processed
 */
export async function rejectWithdrawal(
  params: RejectWithdrawalParams
): Promise<WithdrawalRequestResult> {
  const { requestId, adminUserId, reason } = params;

  // Get the withdrawal request
  const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
  });

  if (!withdrawalRequest) {
    throw new Error('Withdrawal request not found');
  }

  if (withdrawalRequest.status !== WithdrawalStatus.PENDING) {
    throw new Error(
      `Withdrawal request is already ${withdrawalRequest.status.toLowerCase()}`
    );
  }

  // Update withdrawal request status
  const updatedRequest = await prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: {
      status: WithdrawalStatus.REJECTED,
      reviewedByUserId: adminUserId,
      reviewedAt: new Date(),
    },
  });

  // Note: We could add a rejection_reason field to the schema,
  // but for now we'll rely on notifications or a separate audit trail

  return updatedRequest;
}

/**
 * Marks a withdrawal request as completed
 * This is called after the bank transfer has been executed
 *
 * @param requestId - Withdrawal request ID
 * @param adminUserId - Admin user ID
 * @returns The completed withdrawal request
 */
export async function completeWithdrawal(
  requestId: string,
  adminUserId: string
): Promise<WithdrawalRequestResult> {
  // Get the withdrawal request
  const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
  });

  if (!withdrawalRequest) {
    throw new Error('Withdrawal request not found');
  }

  if (withdrawalRequest.status !== WithdrawalStatus.APPROVED) {
    throw new Error(
      `Withdrawal request must be approved before completion. Current status: ${withdrawalRequest.status}`
    );
  }

  // Update withdrawal request status to completed
  const updatedRequest = await prisma.withdrawalRequest.update({
    where: { id: requestId },
    data: {
      status: WithdrawalStatus.COMPLETED,
    },
  });

  return updatedRequest;
}

/**
 * Lists withdrawal requests with filtering and pagination
 * Can be used by dropshippers to see their own requests or by admins to see all
 *
 * @param params - Filtering and pagination parameters
 * @returns Paginated list of withdrawal requests
 */
export async function listWithdrawalRequests(
  params: ListWithdrawalRequestsParams = {}
) {
  const {
    dropshipperId,
    status,
    page = 1,
    pageSize = 20,
    startDate,
    endDate,
  } = params;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: any = {
    ...(dropshipperId && { dropshipperId }),
    ...(status && { status }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  // Get total count and requests in parallel
  const [total, requests] = await Promise.all([
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        dropshipper: {
          select: {
            id: true,
            razonSocial: true,
            cuit: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            cbu: true,
            alias: true,
            accountHolder: true,
            bankName: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    }),
  ]);

  return {
    requests,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Gets a single withdrawal request by ID
 *
 * @param requestId - Withdrawal request ID
 * @returns Withdrawal request with related data
 * @throws Error if request not found
 */
export async function getWithdrawalRequest(requestId: string) {
  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: requestId },
    include: {
      dropshipper: {
        select: {
          id: true,
          razonSocial: true,
          cuit: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      bankAccount: {
        select: {
          id: true,
          cbu: true,
          alias: true,
          accountHolder: true,
          bankName: true,
          accountType: true,
        },
      },
      reviewedBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!request) {
    throw new Error('Withdrawal request not found');
  }

  return request;
}

/**
 * Gets withdrawal request statistics
 *
 * @param dropshipperId - Optional dropshipper ID to filter by
 * @returns Statistics for withdrawal requests
 */
export async function getWithdrawalStats(dropshipperId?: string) {
  const where = dropshipperId ? { dropshipperId } : {};

  const [
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    completedRequests,
  ] = await Promise.all([
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.count({
      where: { ...where, status: WithdrawalStatus.PENDING },
    }),
    prisma.withdrawalRequest.count({
      where: { ...where, status: WithdrawalStatus.APPROVED },
    }),
    prisma.withdrawalRequest.count({
      where: { ...where, status: WithdrawalStatus.REJECTED },
    }),
    prisma.withdrawalRequest.count({
      where: { ...where, status: WithdrawalStatus.COMPLETED },
    }),
  ]);

  // Get total amounts
  const completedWithdrawals = await prisma.withdrawalRequest.findMany({
    where: { ...where, status: WithdrawalStatus.COMPLETED },
    select: { amount: true },
  });

  const totalCompletedAmount = completedWithdrawals.reduce(
    (sum, w) => sum.plus(w.amount),
    new Decimal(0)
  );

  // Get pending amount
  const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
    where: {
      ...where,
      status: { in: [WithdrawalStatus.PENDING, WithdrawalStatus.APPROVED] },
    },
    select: { amount: true },
  });

  const totalPendingAmount = pendingWithdrawals.reduce(
    (sum, w) => sum.plus(w.amount),
    new Decimal(0)
  );

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    completedRequests,
    totalCompletedAmount,
    totalPendingAmount,
  };
}