import { prisma } from '@/lib/prisma';
import { createTransactions } from './transaction';
import { TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CODReconciliationResult {
  orderId: string;
  dropshipperId: string;
  totalAmount: Decimal;
  productCost: Decimal;
  commissionAmount: Decimal;
  deductedAmount: Decimal;
  creditedAmount: Decimal;
  transactions: Array<{
    id: string;
    type: TransactionType;
    amount: Decimal;
  }>;
}

/**
 * Reconciles a COD (Cash on Delivery) order
 * Triggers when order state = "Delivered" and payment_type = "COD"
 *
 * Creates two transactions:
 * 1. COD_DEDUCTION: Debit for product cost + commission
 * 2. COD_CREDIT: Credit for the remainder (collected amount - deductions)
 *
 * @param orderId - Order ID to reconcile
 * @param systemUserId - User ID performing the reconciliation (usually system or admin)
 * @returns Reconciliation result
 * @throws Error if order is not eligible for reconciliation
 */
export async function reconcileCOD(
  orderId: string,
  systemUserId: string
): Promise<CODReconciliationResult> {
  // Get the order with all necessary details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      walletTransactions: {
        where: {
          type: {
            in: ['COD_DEDUCTION', 'COD_CREDIT'],
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Validate order is eligible for COD reconciliation
  if (order.paymentType !== 'COD') {
    throw new Error(`Order ${orderId} is not a COD order`);
  }

  if (order.state !== 'DELIVERED') {
    throw new Error(
      `Order ${orderId} is not delivered. Current state: ${order.state}`
    );
  }

  // Check if already reconciled
  if (order.walletTransactions.length > 0) {
    throw new Error(`Order ${orderId} has already been reconciled`);
  }

  // Calculate amounts
  const codCollected = order.totalAmount; // Amount collected from customer by carrier
  const toDeduct = order.productCost.plus(order.commissionAmount);
  const toCredit = codCollected.minus(toDeduct);

  // Validate amounts
  if (toCredit.lessThan(0)) {
    throw new Error(
      `Invalid COD reconciliation: collected amount (${codCollected.toFixed(2)}) is less than ` +
        `product cost + commission (${toDeduct.toFixed(2)})`
    );
  }

  // Create both transactions atomically
  const transactions = await createTransactions([
    {
      dropshipperId: order.dropshipperId,
      type: 'COD_DEDUCTION',
      debitAmount: toDeduct,
      orderId,
      description: `COD deduction for order ${orderId}: Product cost (${order.productCost.toFixed(2)}) + Commission (${order.commissionAmount.toFixed(2)})`,
      createdByUserId: systemUserId,
    },
    {
      dropshipperId: order.dropshipperId,
      type: 'COD_CREDIT',
      creditAmount: toCredit,
      orderId,
      description: `COD credit for order ${orderId}: Collected (${codCollected.toFixed(2)}) - Deductions (${toDeduct.toFixed(2)})`,
      createdByUserId: systemUserId,
    },
  ]);

  return {
    orderId,
    dropshipperId: order.dropshipperId,
    totalAmount: codCollected,
    productCost: order.productCost,
    commissionAmount: order.commissionAmount,
    deductedAmount: toDeduct,
    creditedAmount: toCredit,
    transactions: transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount:
        tx.type === 'COD_DEDUCTION' ? tx.debitAmount : tx.creditAmount,
    })),
  };
}

/**
 * Reconciles all eligible COD orders
 * Useful for batch processing or catching up on missed reconciliations
 *
 * @param systemUserId - User ID performing the reconciliation
 * @param batchSize - Maximum number of orders to reconcile in one batch
 * @returns Array of reconciliation results
 */
export async function reconcileAllPendingCOD(
  systemUserId: string,
  batchSize: number = 50
): Promise<{
  successful: CODReconciliationResult[];
  failed: Array<{ orderId: string; error: string }>;
}> {
  // Find all delivered COD orders that haven't been reconciled
  const eligibleOrders = await prisma.order.findMany({
    where: {
      paymentType: 'COD',
      state: 'DELIVERED',
      walletTransactions: {
        none: {
          type: {
            in: ['COD_DEDUCTION', 'COD_CREDIT'],
          },
        },
      },
    },
    take: batchSize,
    select: { id: true },
  });

  const successful: CODReconciliationResult[] = [];
  const failed: Array<{ orderId: string; error: string }> = [];

  // Process each order individually to prevent one failure from stopping others
  for (const order of eligibleOrders) {
    try {
      const result = await reconcileCOD(order.id, systemUserId);
      successful.push(result);
    } catch (error) {
      failed.push({
        orderId: order.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { successful, failed };
}

/**
 * Gets list of COD orders pending reconciliation
 *
 * @param dropshipperId - Optional filter by dropshipper
 * @returns Array of pending COD orders
 */
export async function getPendingCODOrders(dropshipperId?: string) {
  return prisma.order.findMany({
    where: {
      ...(dropshipperId && { dropshipperId }),
      paymentType: 'COD',
      state: 'DELIVERED',
      walletTransactions: {
        none: {
          type: {
            in: ['COD_DEDUCTION', 'COD_CREDIT'],
          },
        },
      },
    },
    select: {
      id: true,
      dropshipperId: true,
      customerName: true,
      totalAmount: true,
      productCost: true,
      commissionAmount: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'asc' },
  });
}

/**
 * Checks if a COD order has been reconciled
 *
 * @param orderId - Order ID
 * @returns true if reconciled, false otherwise
 */
export async function isCODReconciled(orderId: string): Promise<boolean> {
  const count = await prisma.walletTransaction.count({
    where: {
      orderId,
      type: {
        in: ['COD_DEDUCTION', 'COD_CREDIT'],
      },
    },
  });

  // Both transactions should exist if reconciled
  return count === 2;
}

/**
 * Reverses a COD reconciliation (admin function)
 * Creates offsetting transactions to undo the reconciliation
 *
 * @param orderId - Order ID
 * @param systemUserId - User ID performing the reversal
 * @param reason - Reason for reversal
 * @returns Reversal result
 */
export async function reverseCODReconciliation(
  orderId: string,
  systemUserId: string,
  reason: string
): Promise<{
  orderId: string;
  reversedTransactions: Array<{ id: string; type: TransactionType }>;
}> {
  // Get the original reconciliation transactions
  const originalTransactions = await prisma.walletTransaction.findMany({
    where: {
      orderId,
      type: {
        in: ['COD_DEDUCTION', 'COD_CREDIT'],
      },
    },
  });

  if (originalTransactions.length !== 2) {
    throw new Error(
      `Order ${orderId} has not been properly reconciled (found ${originalTransactions.length} transactions)`
    );
  }

  const deduction = originalTransactions.find((tx) => tx.type === 'COD_DEDUCTION');
  const credit = originalTransactions.find((tx) => tx.type === 'COD_CREDIT');

  if (!deduction || !credit) {
    throw new Error(`Order ${orderId} is missing deduction or credit transaction`);
  }

  // Create offsetting transactions using MANUAL_ADJUSTMENT
  const reversalTransactions = await createTransactions([
    {
      dropshipperId: deduction.dropshipperId,
      type: 'MANUAL_ADJUSTMENT',
      creditAmount: deduction.debitAmount, // Credit back the deduction
      orderId,
      description: `COD reconciliation reversal for order ${orderId}: ${reason}`,
      createdByUserId: systemUserId,
    },
    {
      dropshipperId: credit.dropshipperId,
      type: 'MANUAL_ADJUSTMENT',
      debitAmount: credit.creditAmount, // Debit back the credit
      orderId,
      description: `COD reconciliation reversal for order ${orderId}: ${reason}`,
      createdByUserId: systemUserId,
    },
  ]);

  return {
    orderId,
    reversedTransactions: reversalTransactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
    })),
  };
}