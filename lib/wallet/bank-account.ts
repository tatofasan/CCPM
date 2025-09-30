/**
 * Bank Account Business Logic
 *
 * Handles CRUD operations for bank accounts with validation,
 * primary account management, and withdrawal request checks.
 */

import { PrismaClient, BankAccount } from '@prisma/client';
import {
  validateBankAccount,
  BankAccountData,
  validateCBU,
  validateAlias,
  AccountType
} from './bank-validator';

const prisma = new PrismaClient();

/**
 * Error class for bank account operations
 */
export class BankAccountError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BankAccountError';
  }
}

/**
 * Create a new bank account for a dropshipper
 *
 * @param dropshipperId - The dropshipper's profile ID
 * @param data - Bank account data
 * @returns The created bank account
 */
export async function createBankAccount(
  dropshipperId: string,
  data: BankAccountData
): Promise<BankAccount> {
  // Validate bank account data
  const validation = validateBankAccount(data);
  if (!validation.isValid) {
    throw new BankAccountError(
      validation.errors.join(', '),
      'VALIDATION_ERROR',
      400
    );
  }

  // Clean CBU (remove spaces and dashes)
  const cleanedCBU = data.cbu.replace(/[\s-]/g, '');

  // Check if CBU already exists for this dropshipper
  const existingAccount = await prisma.bankAccount.findUnique({
    where: {
      dropshipperId_cbu: {
        dropshipperId,
        cbu: cleanedCBU
      }
    }
  });

  if (existingAccount) {
    throw new BankAccountError(
      'A bank account with this CBU already exists',
      'DUPLICATE_CBU',
      409
    );
  }

  // Check if this is the first bank account for the dropshipper
  const accountCount = await prisma.bankAccount.count({
    where: { dropshipperId }
  });

  const isPrimary = accountCount === 0;

  // Create the bank account
  const bankAccount = await prisma.bankAccount.create({
    data: {
      dropshipperId,
      cbu: cleanedCBU,
      alias: data.alias?.toLowerCase() || null,
      accountHolder: data.accountHolder.trim(),
      accountType: data.accountType,
      bankName: data.bankName.trim(),
      isPrimary
    }
  });

  return bankAccount;
}

/**
 * Update an existing bank account
 *
 * @param accountId - The bank account ID
 * @param dropshipperId - The dropshipper's profile ID (for authorization)
 * @param data - Partial bank account data to update
 * @returns The updated bank account
 */
export async function updateBankAccount(
  accountId: string,
  dropshipperId: string,
  data: Partial<BankAccountData>
): Promise<BankAccount> {
  // Verify account exists and belongs to dropshipper
  const existingAccount = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      dropshipperId
    }
  });

  if (!existingAccount) {
    throw new BankAccountError(
      'Bank account not found',
      'NOT_FOUND',
      404
    );
  }

  // Prepare update data
  const updateData: Partial<{
    cbu: string;
    alias: string | null;
    accountHolder: string;
    accountType: string;
    bankName: string;
  }> = {};

  // Validate and clean CBU if provided
  if (data.cbu !== undefined) {
    if (!validateCBU(data.cbu)) {
      throw new BankAccountError(
        'Invalid CBU format',
        'INVALID_CBU',
        400
      );
    }
    const cleanedCBU = data.cbu.replace(/[\s-]/g, '');

    // Check if new CBU already exists for this dropshipper
    if (cleanedCBU !== existingAccount.cbu) {
      const duplicateAccount = await prisma.bankAccount.findFirst({
        where: {
          dropshipperId,
          cbu: cleanedCBU,
          id: { not: accountId }
        }
      });

      if (duplicateAccount) {
        throw new BankAccountError(
          'A bank account with this CBU already exists',
          'DUPLICATE_CBU',
          409
        );
      }
    }

    updateData.cbu = cleanedCBU;
  }

  // Validate and clean alias if provided
  if (data.alias !== undefined) {
    if (data.alias && !validateAlias(data.alias)) {
      throw new BankAccountError(
        'Invalid alias format',
        'INVALID_ALIAS',
        400
      );
    }
    updateData.alias = data.alias ? data.alias.toLowerCase() : null;
  }

  // Validate other fields
  if (data.accountHolder !== undefined) {
    updateData.accountHolder = data.accountHolder.trim();
  }

  if (data.accountType !== undefined) {
    if (data.accountType !== AccountType.SAVINGS && data.accountType !== AccountType.CHECKING) {
      throw new BankAccountError(
        'Invalid account type',
        'INVALID_ACCOUNT_TYPE',
        400
      );
    }
    updateData.accountType = data.accountType;
  }

  if (data.bankName !== undefined) {
    updateData.bankName = data.bankName.trim();
  }

  // Update the bank account
  const updatedAccount = await prisma.bankAccount.update({
    where: { id: accountId },
    data: updateData
  });

  return updatedAccount;
}

/**
 * Delete a bank account
 *
 * @param accountId - The bank account ID
 * @param dropshipperId - The dropshipper's profile ID (for authorization)
 */
export async function deleteBankAccount(
  accountId: string,
  dropshipperId: string
): Promise<void> {
  // Verify account exists and belongs to dropshipper
  const existingAccount = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      dropshipperId
    }
  });

  if (!existingAccount) {
    throw new BankAccountError(
      'Bank account not found',
      'NOT_FOUND',
      404
    );
  }

  // Check if this is the only bank account
  const accountCount = await prisma.bankAccount.count({
    where: { dropshipperId }
  });

  if (accountCount === 1) {
    throw new BankAccountError(
      'Cannot delete the only bank account. Each dropshipper must have at least one bank account.',
      'LAST_ACCOUNT',
      400
    );
  }

  // Check if account is used in pending withdrawal requests
  const pendingWithdrawals = await prisma.withdrawalRequest.count({
    where: {
      bankAccountId: accountId,
      status: 'PENDING'
    }
  });

  if (pendingWithdrawals > 0) {
    throw new BankAccountError(
      'Cannot delete bank account with pending withdrawal requests',
      'PENDING_WITHDRAWALS',
      400
    );
  }

  // If this is the primary account, set another account as primary first
  if (existingAccount.isPrimary) {
    const anotherAccount = await prisma.bankAccount.findFirst({
      where: {
        dropshipperId,
        id: { not: accountId }
      }
    });

    if (anotherAccount) {
      await prisma.bankAccount.update({
        where: { id: anotherAccount.id },
        data: { isPrimary: true }
      });
    }
  }

  // Delete the bank account
  await prisma.bankAccount.delete({
    where: { id: accountId }
  });
}

/**
 * Get a single bank account by ID
 *
 * @param accountId - The bank account ID
 * @param dropshipperId - The dropshipper's profile ID (for authorization)
 * @returns The bank account
 */
export async function getBankAccount(
  accountId: string,
  dropshipperId: string
): Promise<BankAccount> {
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      dropshipperId
    }
  });

  if (!account) {
    throw new BankAccountError(
      'Bank account not found',
      'NOT_FOUND',
      404
    );
  }

  return account;
}

/**
 * List all bank accounts for a dropshipper
 *
 * @param dropshipperId - The dropshipper's profile ID
 * @returns Array of bank accounts
 */
export async function listBankAccounts(
  dropshipperId: string
): Promise<BankAccount[]> {
  const accounts = await prisma.bankAccount.findMany({
    where: { dropshipperId },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return accounts;
}

/**
 * Set a bank account as primary
 *
 * @param accountId - The bank account ID to set as primary
 * @param dropshipperId - The dropshipper's profile ID (for authorization)
 * @returns The updated bank account
 */
export async function setPrimaryAccount(
  accountId: string,
  dropshipperId: string
): Promise<BankAccount> {
  // Verify account exists and belongs to dropshipper
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      dropshipperId
    }
  });

  if (!account) {
    throw new BankAccountError(
      'Bank account not found',
      'NOT_FOUND',
      404
    );
  }

  // If already primary, no need to update
  if (account.isPrimary) {
    return account;
  }

  // Use atomic transaction to set new primary and unset old primary
  const updatedAccount = await prisma.$transaction(async (tx) => {
    // Set all accounts to non-primary
    await tx.bankAccount.updateMany({
      where: { dropshipperId },
      data: { isPrimary: false }
    });

    // Set target account to primary
    const updated = await tx.bankAccount.update({
      where: { id: accountId },
      data: { isPrimary: true }
    });

    return updated;
  });

  return updatedAccount;
}

/**
 * Get primary bank account for a dropshipper
 *
 * @param dropshipperId - The dropshipper's profile ID
 * @returns The primary bank account or null if none exists
 */
export async function getPrimaryBankAccount(
  dropshipperId: string
): Promise<BankAccount | null> {
  const account = await prisma.bankAccount.findFirst({
    where: {
      dropshipperId,
      isPrimary: true
    }
  });

  return account;
}