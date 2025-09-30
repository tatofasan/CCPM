import { prisma } from '@/lib/prisma';
import { DepositStatus, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createTransaction } from './transaction';

export interface CreateDepositRequestParams {
  dropshipperId: string;
  amount: number | Decimal;
  receiptUrl?: string;
  observations?: string;
}

export interface DepositRequestResult {
  id: string;
  dropshipperId: string;
  amount: Decimal;
  receiptUrl: string | null;
  observations: string | null;
  status: DepositStatus;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApproveDepositParams {
  requestId: string;
  adminUserId: string;
}

export interface RejectDepositParams {
  requestId: string;
  adminUserId: string;
  reason: string;
}

export interface ListDepositRequestsParams {
  dropshipperId?: string;
  status?: DepositStatus;
  page?: number;
  pageSize?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Creates a new deposit request
 * Dropshippers request deposits by uploading a receipt
 *
 * @param params - Deposit request parameters
 * @returns The created deposit request
 * @throws Error if validation fails
 */
export async function createDepositRequest(
  params: CreateDepositRequestParams
): Promise<DepositRequestResult> {
  const { dropshipperId, amount, receiptUrl, observations } = params;

  // Validate amount
  const depositAmount = new Decimal(amount);
  if (depositAmount.lessThanOrEqualTo(0)) {
    throw new Error('Deposit amount must be greater than 0');
  }

  // Create deposit request
  const depositRequest = await prisma.depositRequest.create({
    data: {
      dropshipperId,
      amount: depositAmount,
      receiptUrl: receiptUrl || null,
      observations: observations || null,
      status: DepositStatus.PENDING,
    },
  });

  return depositRequest;
}

/**
 * Approves a deposit request and creates a DEPOSIT transaction
 * This credits the dropshipper's wallet balance
 *
 * @param params - Approval parameters
 * @returns The approved deposit request
 * @throws Error if request not found, already processed, or transaction fails
 */
export async function approveDeposit(
  params: ApproveDepositParams
): Promise<DepositRequestResult> {
  const { requestId, adminUserId } = params;

  // Get the deposit request
  const depositRequest = await prisma.depositRequest.findUnique({
    where: { id: requestId },
  });

  if (!depositRequest) {
    throw new Error('Deposit request not found');
  }

  if (depositRequest.status !== DepositStatus.PENDING) {
    throw new Error(
      `Deposit request is already ${depositRequest.status.toLowerCase()}`
    );
  }

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Update deposit request status
    const updatedRequest = await tx.depositRequest.update({
      where: { id: requestId },
      data: {
        status: DepositStatus.APPROVED,
        reviewedByUserId: adminUserId,
        reviewedAt: new Date(),
      },
    });

    // Create DEPOSIT transaction to credit wallet
    await createTransaction({
      dropshipperId: depositRequest.dropshipperId,
      type: TransactionType.DEPOSIT,
      creditAmount: depositRequest.amount,
      description: `Deposit approved - Request #${requestId}`,
      createdByUserId: adminUserId,
    });

    return updatedRequest;
  });

  return result;
}

/**
 * Rejects a deposit request
 * The request is marked as rejected with a reason
 *
 * @param params - Rejection parameters
 * @returns The rejected deposit request
 * @throws Error if request not found or already processed
 */
export async function rejectDeposit(
  params: RejectDepositParams
): Promise<DepositRequestResult> {
  const { requestId, adminUserId, reason } = params;

  // Get the deposit request
  const depositRequest = await prisma.depositRequest.findUnique({
    where: { id: requestId },
  });

  if (!depositRequest) {
    throw new Error('Deposit request not found');
  }

  if (depositRequest.status !== DepositStatus.PENDING) {
    throw new Error(
      `Deposit request is already ${depositRequest.status.toLowerCase()}`
    );
  }

  // Update deposit request status
  const updatedRequest = await prisma.depositRequest.update({
    where: { id: requestId },
    data: {
      status: DepositStatus.REJECTED,
      reviewedByUserId: adminUserId,
      reviewedAt: new Date(),
      observations: depositRequest.observations
        ? `${depositRequest.observations}\n\nRejection reason: ${reason}`
        : `Rejection reason: ${reason}`,
    },
  });

  return updatedRequest;
}

/**
 * Lists deposit requests with filtering and pagination
 * Can be used by dropshippers to see their own requests or by admins to see all
 *
 * @param params - Filtering and pagination parameters
 * @returns Paginated list of deposit requests
 */
export async function listDepositRequests(params: ListDepositRequestsParams = {}) {
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
    prisma.depositRequest.count({ where }),
    prisma.depositRequest.findMany({
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
 * Gets a single deposit request by ID
 *
 * @param requestId - Deposit request ID
 * @returns Deposit request with related data
 * @throws Error if request not found
 */
export async function getDepositRequest(requestId: string) {
  const request = await prisma.depositRequest.findUnique({
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
    throw new Error('Deposit request not found');
  }

  return request;
}

/**
 * Gets deposit request statistics
 *
 * @param dropshipperId - Optional dropshipper ID to filter by
 * @returns Statistics for deposit requests
 */
export async function getDepositStats(dropshipperId?: string) {
  const where = dropshipperId ? { dropshipperId } : {};

  const [totalRequests, pendingRequests, approvedRequests, rejectedRequests] =
    await Promise.all([
      prisma.depositRequest.count({ where }),
      prisma.depositRequest.count({
        where: { ...where, status: DepositStatus.PENDING },
      }),
      prisma.depositRequest.count({
        where: { ...where, status: DepositStatus.APPROVED },
      }),
      prisma.depositRequest.count({
        where: { ...where, status: DepositStatus.REJECTED },
      }),
    ]);

  // Get total amounts
  const approvedDeposits = await prisma.depositRequest.findMany({
    where: { ...where, status: DepositStatus.APPROVED },
    select: { amount: true },
  });

  const totalApprovedAmount = approvedDeposits.reduce(
    (sum, d) => sum.plus(d.amount),
    new Decimal(0)
  );

  return {
    totalRequests,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    totalApprovedAmount,
  };
}