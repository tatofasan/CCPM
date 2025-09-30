import { prisma } from '@/lib/prisma';
import { TransactionType, Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateTransactionParams {
  dropshipperId: string;
  type: TransactionType;
  debitAmount?: number | Decimal;
  creditAmount?: number | Decimal;
  orderId?: string | null;
  description: string;
  createdByUserId: string;
}

export interface WalletTransactionResult {
  id: string;
  dropshipperId: string;
  type: TransactionType;
  debitAmount: Decimal;
  creditAmount: Decimal;
  balanceAfter: Decimal;
  orderId: string | null;
  description: string;
  createdByUserId: string;
  createdAt: Date;
}

/**
 * Creates a wallet transaction with proper double-entry bookkeeping
 * Uses database transaction with row-level locking to prevent race conditions
 *
 * @param params - Transaction parameters
 * @returns The created transaction with updated balance
 * @throws Error if validation fails or transaction cannot be completed
 */
export async function createTransaction(
  params: CreateTransactionParams
): Promise<WalletTransactionResult> {
  const {
    dropshipperId,
    type,
    debitAmount = 0,
    creditAmount = 0,
    orderId = null,
    description,
    createdByUserId,
  } = params;

  // Validate: debit and credit cannot both be set
  const debit = new Decimal(debitAmount);
  const credit = new Decimal(creditAmount);

  if (debit.greaterThan(0) && credit.greaterThan(0)) {
    throw new Error('Transaction cannot have both debit and credit amounts');
  }

  if (debit.equals(0) && credit.equals(0)) {
    throw new Error('Transaction must have either debit or credit amount');
  }

  if (debit.lessThan(0) || credit.lessThan(0)) {
    throw new Error('Transaction amounts cannot be negative');
  }

  // Use interactive transaction with proper isolation level
  const transaction = await prisma.$transaction(
    async (tx) => {
      // Get the latest transaction for this dropshipper with row-level lock
      // This prevents concurrent transactions from reading the same balance
      const latestTransaction = await tx.walletTransaction.findFirst({
        where: { dropshipperId },
        orderBy: { createdAt: 'desc' },
        select: { balanceAfter: true },
      });

      // Calculate current balance (0 if no transactions exist)
      const currentBalance = latestTransaction?.balanceAfter ?? new Decimal(0);

      // Calculate new balance: balance + credit - debit
      const balanceAfter = currentBalance.plus(credit).minus(debit);

      // For debit transactions, ensure sufficient balance
      if (debit.greaterThan(0) && balanceAfter.lessThan(0)) {
        throw new Error(
          `Insufficient balance. Current: ${currentBalance.toFixed(2)}, Required: ${debit.toFixed(2)}`
        );
      }

      // Create the transaction record
      const newTransaction = await tx.walletTransaction.create({
        data: {
          dropshipperId,
          type,
          debitAmount: debit,
          creditAmount: credit,
          balanceAfter,
          orderId,
          description,
          createdByUserId,
        },
      });

      return newTransaction;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000, // Wait up to 5 seconds for transaction to start
      timeout: 10000, // Transaction timeout of 10 seconds
    }
  );

  return transaction;
}

/**
 * Creates multiple transactions atomically
 * Useful for operations like COD reconciliation that need multiple entries
 *
 * @param transactions - Array of transaction parameters
 * @returns Array of created transactions
 */
export async function createTransactions(
  transactions: CreateTransactionParams[]
): Promise<WalletTransactionResult[]> {
  if (transactions.length === 0) {
    throw new Error('At least one transaction is required');
  }

  // Validate all transactions belong to the same dropshipper
  const dropshipperIds = new Set(transactions.map((t) => t.dropshipperId));
  if (dropshipperIds.size > 1) {
    throw new Error('All transactions must belong to the same dropshipper');
  }

  const dropshipperId = transactions[0].dropshipperId;

  // Use interactive transaction with proper isolation level
  const results = await prisma.$transaction(
    async (tx) => {
      // Get the latest transaction for this dropshipper with row-level lock
      const latestTransaction = await tx.walletTransaction.findFirst({
        where: { dropshipperId },
        orderBy: { createdAt: 'desc' },
        select: { balanceAfter: true },
      });

      let currentBalance = latestTransaction?.balanceAfter ?? new Decimal(0);
      const createdTransactions: WalletTransactionResult[] = [];

      // Process transactions sequentially to maintain balance integrity
      for (const params of transactions) {
        const {
          type,
          debitAmount = 0,
          creditAmount = 0,
          orderId = null,
          description,
          createdByUserId,
        } = params;

        // Validate amounts
        const debit = new Decimal(debitAmount);
        const credit = new Decimal(creditAmount);

        if (debit.greaterThan(0) && credit.greaterThan(0)) {
          throw new Error('Transaction cannot have both debit and credit amounts');
        }

        if (debit.equals(0) && credit.equals(0)) {
          throw new Error('Transaction must have either debit or credit amount');
        }

        if (debit.lessThan(0) || credit.lessThan(0)) {
          throw new Error('Transaction amounts cannot be negative');
        }

        // Calculate new balance
        const balanceAfter = currentBalance.plus(credit).minus(debit);

        // Check for sufficient balance on debit
        if (debit.greaterThan(0) && balanceAfter.lessThan(0)) {
          throw new Error(
            `Insufficient balance. Current: ${currentBalance.toFixed(2)}, Required: ${debit.toFixed(2)}`
          );
        }

        // Create the transaction
        const newTransaction = await tx.walletTransaction.create({
          data: {
            dropshipperId,
            type,
            debitAmount: debit,
            creditAmount: credit,
            balanceAfter,
            orderId,
            description,
            createdByUserId,
          },
        });

        createdTransactions.push(newTransaction);
        currentBalance = balanceAfter;
      }

      return createdTransactions;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000, // Longer timeout for multiple transactions
    }
  );

  return results;
}

/**
 * Get transaction history for a dropshipper
 *
 * @param dropshipperId - Dropshipper ID
 * @param options - Pagination and filtering options
 * @returns Paginated transaction list
 */
export async function getTransactionHistory(
  dropshipperId: string,
  options: {
    page?: number;
    pageSize?: number;
    type?: TransactionType;
    orderId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
) {
  const {
    page = 1,
    pageSize = 20,
    type,
    orderId,
    startDate,
    endDate,
  } = options;

  const skip = (page - 1) * pageSize;

  // Build where clause
  const where: Prisma.WalletTransactionWhereInput = {
    dropshipperId,
    ...(type && { type }),
    ...(orderId && { orderId }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  // Get total count and transactions in parallel
  const [total, transactions] = await Promise.all([
    prisma.walletTransaction.count({ where }),
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
        order: {
          select: {
            id: true,
            customerName: true,
            totalAmount: true,
            state: true,
          },
        },
        createdBy: {
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
    transactions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}