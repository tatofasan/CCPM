import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface BalanceIndicators {
  available: Decimal;
  withdrawable: Decimal;
  projected: Decimal;
}

/**
 * Gets the current balance for a dropshipper
 * This is the most recent balance_after value from their transactions
 *
 * @param dropshipperId - Dropshipper ID
 * @returns Current balance
 */
export async function getCurrentBalance(dropshipperId: string): Promise<Decimal> {
  const latestTransaction = await prisma.walletTransaction.findFirst({
    where: { dropshipperId },
    orderBy: { createdAt: 'desc' },
    select: { balanceAfter: true },
  });

  return latestTransaction?.balanceAfter ?? new Decimal(0);
}

/**
 * Gets all balance indicators for a dropshipper
 *
 * Available: Sum of all transactions (credit - debit)
 * Withdrawable: Available - pending withdrawals
 * Projected: Available + pending COD collections
 *
 * @param dropshipperId - Dropshipper ID
 * @returns Balance indicators
 */
export async function getBalance(dropshipperId: string): Promise<BalanceIndicators> {
  // Get current available balance (most efficient - just get latest transaction)
  const available = await getCurrentBalance(dropshipperId);

  // Get pending withdrawals (withdrawals not yet completed)
  const pendingWithdrawals = await prisma.withdrawalRequest.findMany({
    where: {
      dropshipperId,
      status: {
        in: ['PENDING', 'APPROVED'],
      },
    },
    select: { amount: true },
  });

  const pendingWithdrawalAmount = pendingWithdrawals.reduce(
    (sum, w) => sum.plus(w.amount),
    new Decimal(0)
  );

  // Get pending COD collections (orders that are delivered but not yet reconciled)
  // These are orders where:
  // 1. payment_type = COD
  // 2. state = DELIVERED
  // 3. No COD_CREDIT transaction exists for that order
  const deliveredCODOrders = await prisma.order.findMany({
    where: {
      dropshipperId,
      paymentType: 'COD',
      state: 'DELIVERED',
    },
    select: {
      id: true,
      totalAmount: true,
      productCost: true,
      commissionAmount: true,
      walletTransactions: {
        where: {
          type: 'COD_CREDIT',
        },
        select: { id: true },
      },
    },
  });

  // Calculate projected COD collections (only orders without COD_CREDIT transaction)
  const pendingCODCollections = deliveredCODOrders
    .filter((order) => order.walletTransactions.length === 0)
    .reduce((sum, order) => {
      // The amount that will be credited: totalAmount - productCost - commission
      const netAmount = order.totalAmount
        .minus(order.productCost)
        .minus(order.commissionAmount);
      return sum.plus(netAmount);
    }, new Decimal(0));

  return {
    available,
    withdrawable: available.minus(pendingWithdrawalAmount),
    projected: available.plus(pendingCODCollections),
  };
}

/**
 * Validates if a dropshipper has sufficient balance for a transaction
 *
 * @param dropshipperId - Dropshipper ID
 * @param amount - Amount to validate
 * @returns true if sufficient balance, false otherwise
 */
export async function validateBalance(
  dropshipperId: string,
  amount: number | Decimal
): Promise<boolean> {
  const currentBalance = await getCurrentBalance(dropshipperId);
  const requiredAmount = new Decimal(amount);

  return currentBalance.greaterThanOrEqualTo(requiredAmount);
}

/**
 * Validates if a dropshipper has sufficient withdrawable balance
 * This considers pending withdrawals
 *
 * @param dropshipperId - Dropshipper ID
 * @param amount - Amount to validate
 * @returns true if sufficient withdrawable balance, false otherwise
 */
export async function validateWithdrawableBalance(
  dropshipperId: string,
  amount: number | Decimal
): Promise<boolean> {
  const balance = await getBalance(dropshipperId);
  const requiredAmount = new Decimal(amount);

  return balance.withdrawable.greaterThanOrEqualTo(requiredAmount);
}

/**
 * Calculates the sum of all transactions to verify balance integrity
 * Used for daily reconciliation
 *
 * @param dropshipperId - Dropshipper ID
 * @returns Object with calculated balance and latest balance_after
 */
export async function calculateBalanceSum(dropshipperId: string): Promise<{
  calculatedBalance: Decimal;
  latestBalance: Decimal;
  isValid: boolean;
}> {
  // Get all transactions for this dropshipper
  const transactions = await prisma.walletTransaction.findMany({
    where: { dropshipperId },
    orderBy: { createdAt: 'asc' },
    select: {
      creditAmount: true,
      debitAmount: true,
      balanceAfter: true,
    },
  });

  if (transactions.length === 0) {
    return {
      calculatedBalance: new Decimal(0),
      latestBalance: new Decimal(0),
      isValid: true,
    };
  }

  // Sum all credits and debits
  const calculatedBalance = transactions.reduce((sum, tx) => {
    return sum.plus(tx.creditAmount).minus(tx.debitAmount);
  }, new Decimal(0));

  // Get the latest balance_after value
  const latestBalance = transactions[transactions.length - 1].balanceAfter;

  // Check if they match
  const isValid = calculatedBalance.equals(latestBalance);

  return {
    calculatedBalance,
    latestBalance,
    isValid,
  };
}

/**
 * Verifies balance integrity by checking if sum of transactions equals balance_after
 * Returns list of discrepancies
 *
 * @param dropshipperId - Optional dropshipper ID to check specific user
 * @returns Array of dropshippers with balance discrepancies
 */
export async function verifyBalanceIntegrity(dropshipperId?: string): Promise<
  Array<{
    dropshipperId: string;
    calculatedBalance: string;
    latestBalance: string;
    discrepancy: string;
  }>
> {
  // Get all dropshippers to check
  const dropshippers = dropshipperId
    ? [{ id: dropshipperId }]
    : await prisma.dropshipperProfile.findMany({
        select: { id: true },
      });

  const discrepancies: Array<{
    dropshipperId: string;
    calculatedBalance: string;
    latestBalance: string;
    discrepancy: string;
  }> = [];

  for (const ds of dropshippers) {
    const { calculatedBalance, latestBalance, isValid } = await calculateBalanceSum(
      ds.id
    );

    if (!isValid) {
      discrepancies.push({
        dropshipperId: ds.id,
        calculatedBalance: calculatedBalance.toFixed(2),
        latestBalance: latestBalance.toFixed(2),
        discrepancy: calculatedBalance.minus(latestBalance).toFixed(2),
      });
    }
  }

  return discrepancies;
}

/**
 * Gets transaction statistics for a dropshipper
 *
 * @param dropshipperId - Dropshipper ID
 * @returns Transaction statistics
 */
export async function getTransactionStats(dropshipperId: string): Promise<{
  totalCredits: Decimal;
  totalDebits: Decimal;
  totalTransactions: number;
  transactionsByType: Record<TransactionType, number>;
}> {
  const transactions = await prisma.walletTransaction.findMany({
    where: { dropshipperId },
    select: {
      creditAmount: true,
      debitAmount: true,
      type: true,
    },
  });

  const totalCredits = transactions.reduce(
    (sum, tx) => sum.plus(tx.creditAmount),
    new Decimal(0)
  );

  const totalDebits = transactions.reduce(
    (sum, tx) => sum.plus(tx.debitAmount),
    new Decimal(0)
  );

  const transactionsByType = transactions.reduce(
    (acc, tx) => {
      acc[tx.type] = (acc[tx.type] || 0) + 1;
      return acc;
    },
    {} as Record<TransactionType, number>
  );

  return {
    totalCredits,
    totalDebits,
    totalTransactions: transactions.length,
    transactionsByType,
  };
}