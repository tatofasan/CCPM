import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { createTransaction } from './transaction';

export type ManualAdjustmentType = 'CREDIT' | 'DEBIT';

export interface CreateManualAdjustmentParams {
  dropshipperId: string;
  amount: number | Decimal;
  type: ManualAdjustmentType;
  reason: string;
  adminUserId: string;
}

export interface ManualAdjustmentResult {
  id: string;
  dropshipperId: string;
  type: TransactionType;
  debitAmount: Decimal;
  creditAmount: Decimal;
  balanceAfter: Decimal;
  description: string;
  createdByUserId: string;
  createdAt: Date;
}

/**
 * Creates a manual adjustment to a dropshipper's wallet
 * This is an admin-only operation used for corrections, refunds, or special adjustments
 *
 * Manual adjustments can be:
 * - CREDIT: Add funds to the wallet (e.g., refund, bonus, correction)
 * - DEBIT: Remove funds from the wallet (e.g., correction, penalty)
 *
 * @param params - Manual adjustment parameters
 * @returns The created transaction
 * @throws Error if validation fails
 */
export async function createManualAdjustment(
  params: CreateManualAdjustmentParams
): Promise<ManualAdjustmentResult> {
  const { dropshipperId, amount, type, reason, adminUserId } = params;

  // Validate amount
  const adjustmentAmount = new Decimal(amount);
  if (adjustmentAmount.lessThanOrEqualTo(0)) {
    throw new Error('Adjustment amount must be greater than 0');
  }

  // Validate reason
  if (!reason || reason.trim().length === 0) {
    throw new Error('Adjustment reason is required');
  }

  if (reason.length < 10) {
    throw new Error('Adjustment reason must be at least 10 characters');
  }

  // Build description
  const description = `Manual adjustment (${type}): ${reason}`;

  // Create transaction based on type
  const transaction = await createTransaction({
    dropshipperId,
    type: TransactionType.MANUAL_ADJUSTMENT,
    creditAmount: type === 'CREDIT' ? adjustmentAmount : 0,
    debitAmount: type === 'DEBIT' ? adjustmentAmount : 0,
    description,
    createdByUserId: adminUserId,
  });

  return transaction;
}

/**
 * Validates if an admin can perform manual adjustments
 * This checks if the user has ADMIN or SUPPORT role with appropriate permissions
 *
 * @param userId - User ID to validate
 * @returns true if user can perform manual adjustments
 */
export async function canPerformManualAdjustment(userId: string): Promise<boolean> {
  // This is a placeholder for role-based access control
  // In a real implementation, you would check the user's role and permissions
  // For now, we'll assume the caller has already validated the user's role
  return true;
}

/**
 * Gets a summary of manual adjustments for a dropshipper
 * Useful for audit trail and reporting
 *
 * @param dropshipperId - Dropshipper ID
 * @param startDate - Optional start date filter
 * @param endDate - Optional end date filter
 * @returns Summary of manual adjustments
 */
export async function getManualAdjustmentSummary(
  dropshipperId: string,
  startDate?: Date,
  endDate?: Date
) {
  const { prisma } = await import('@/lib/prisma');

  const where: any = {
    dropshipperId,
    type: TransactionType.MANUAL_ADJUSTMENT,
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  const adjustments = await prisma.walletTransaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  // Calculate totals
  const totalCredits = adjustments.reduce(
    (sum, adj) => sum.plus(adj.creditAmount),
    new Decimal(0)
  );

  const totalDebits = adjustments.reduce(
    (sum, adj) => sum.plus(adj.debitAmount),
    new Decimal(0)
  );

  const netAdjustment = totalCredits.minus(totalDebits);

  return {
    adjustments,
    summary: {
      totalCount: adjustments.length,
      totalCredits,
      totalDebits,
      netAdjustment,
    },
  };
}

/**
 * Validates a manual adjustment before creating it
 * Performs business rule checks specific to manual adjustments
 *
 * @param params - Manual adjustment parameters
 * @throws Error if validation fails
 */
export function validateManualAdjustment(
  params: CreateManualAdjustmentParams
): void {
  const { amount, type, reason } = params;

  // Validate amount
  const adjustmentAmount = new Decimal(amount);
  if (adjustmentAmount.lessThanOrEqualTo(0)) {
    throw new Error('Adjustment amount must be greater than 0');
  }

  // Validate type
  if (type !== 'CREDIT' && type !== 'DEBIT') {
    throw new Error('Adjustment type must be CREDIT or DEBIT');
  }

  // Validate reason
  if (!reason || reason.trim().length === 0) {
    throw new Error('Adjustment reason is required');
  }

  if (reason.length < 10) {
    throw new Error('Adjustment reason must be at least 10 characters');
  }

  if (reason.length > 500) {
    throw new Error('Adjustment reason must not exceed 500 characters');
  }

  // Check for potentially suspicious adjustments
  // These thresholds can be configured based on business rules
  const HIGH_AMOUNT_THRESHOLD = 50000; // $50,000
  if (adjustmentAmount.greaterThan(HIGH_AMOUNT_THRESHOLD)) {
    // In a real system, you might want to require additional approvals
    // or send alerts for high-value adjustments
    console.warn(
      `High-value manual adjustment: ${type} $${adjustmentAmount.toFixed(2)} - ${reason}`
    );
  }
}