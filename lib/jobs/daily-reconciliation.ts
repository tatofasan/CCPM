import { verifyBalanceIntegrity } from '@/lib/wallet/balance';
import { reconcileAllPendingCOD } from '@/lib/wallet/reconciliation';
import { prisma } from '@/lib/prisma';

export interface DailyReconciliationResult {
  timestamp: Date;
  balanceIntegrity: {
    checked: number;
    discrepancies: Array<{
      dropshipperId: string;
      calculatedBalance: string;
      latestBalance: string;
      discrepancy: string;
    }>;
  };
  codReconciliation: {
    processed: number;
    successful: number;
    failed: number;
    failedOrders: Array<{ orderId: string; error: string }>;
  };
}

/**
 * Daily reconciliation job
 * Runs daily to:
 * 1. Verify balance integrity (sum of transactions = balance_after)
 * 2. Reconcile any pending COD orders
 * 3. Alert if discrepancies found
 *
 * This should be scheduled to run via cron or a job scheduler
 * Example: Every day at 2 AM
 *
 * @param systemUserId - User ID to attribute system actions to
 * @returns Reconciliation result
 */
export async function runDailyReconciliation(
  systemUserId: string
): Promise<DailyReconciliationResult> {
  const timestamp = new Date();

  console.log('[DailyReconciliation] Starting daily reconciliation job...');

  // Step 1: Verify balance integrity for all dropshippers
  console.log('[DailyReconciliation] Verifying balance integrity...');
  const discrepancies = await verifyBalanceIntegrity();

  if (discrepancies.length > 0) {
    console.error(
      `[DailyReconciliation] ALERT: Found ${discrepancies.length} balance discrepancies!`
    );
    discrepancies.forEach((d) => {
      console.error(
        `[DailyReconciliation] - Dropshipper ${d.dropshipperId}: ` +
          `Calculated: ${d.calculatedBalance}, Latest: ${d.latestBalance}, ` +
          `Discrepancy: ${d.discrepancy}`
      );
    });

    // TODO: Send alert email/notification to admins
  } else {
    console.log('[DailyReconciliation] Balance integrity verified - all balances correct');
  }

  // Step 2: Reconcile pending COD orders
  console.log('[DailyReconciliation] Reconciling pending COD orders...');
  const codResult = await reconcileAllPendingCOD(systemUserId);

  console.log(
    `[DailyReconciliation] COD reconciliation complete: ` +
      `${codResult.successful.length} successful, ${codResult.failed.length} failed`
  );

  if (codResult.failed.length > 0) {
    console.warn('[DailyReconciliation] Failed COD reconciliations:');
    codResult.failed.forEach((f) => {
      console.warn(`[DailyReconciliation] - Order ${f.orderId}: ${f.error}`);
    });
  }

  // Step 3: Get count of all dropshippers checked
  const totalDropshippers = await prisma.dropshipperProfile.count();

  const result: DailyReconciliationResult = {
    timestamp,
    balanceIntegrity: {
      checked: totalDropshippers,
      discrepancies,
    },
    codReconciliation: {
      processed: codResult.successful.length + codResult.failed.length,
      successful: codResult.successful.length,
      failed: codResult.failed.length,
      failedOrders: codResult.failed,
    },
  };

  console.log('[DailyReconciliation] Daily reconciliation job completed');

  return result;
}

/**
 * API endpoint handler for manual reconciliation trigger
 * Should be protected to admin-only access
 */
export async function handleManualReconciliation(systemUserId: string) {
  try {
    const result = await runDailyReconciliation(systemUserId);

    // Log result to database for audit trail
    // TODO: Create ReconciliationLog table to store results

    return {
      success: true,
      result,
    };
  } catch (error) {
    console.error('[DailyReconciliation] Error during reconciliation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}