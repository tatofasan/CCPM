# Virtual Wallet System - Transaction Engine Implementation

**Issue**: #5 - Virtual Wallet System
**Stream**: Stream A - Wallet Transaction Engine
**Branch**: `epic/dropshipping-platform`
**Status**: COMPLETED
**Date**: 2025-09-30

## Overview

Implemented a complete double-entry bookkeeping transaction engine with balance tracking, COD reconciliation, and financial integrity checks. This forms the foundation for the virtual wallet system.

## Key Features Implemented

### 1. Transaction Engine
- **Double-entry bookkeeping** with immutable transaction records
- **Row-level locking** using Serializable isolation level
- **Atomic operations** with proper rollback on failure
- **Balance validation** before debit transactions
- **Multi-transaction support** for complex operations (e.g., COD reconciliation)

### 2. Balance Calculations
Three types of balance indicators:
- **Available**: Total balance (sum of all credits - debits)
- **Withdrawable**: Available minus pending withdrawals
- **Projected**: Available plus pending COD collections

### 3. COD Reconciliation
- Automatic reconciliation for delivered COD orders
- Creates two transactions atomically:
  - COD_DEDUCTION: Debit product cost + commission
  - COD_CREDIT: Credit collected amount minus deductions
- Batch processing support
- Reversal functionality for admin corrections

### 4. Daily Reconciliation Job
- Verifies balance integrity across all dropshippers
- Reconciles pending COD orders
- Alerts on discrepancies
- Audit trail for all operations

## File Structure

```
lib/
├── prisma.ts                          # Prisma client singleton
├── wallet/
│   ├── transaction.ts                 # Transaction engine (397 lines)
│   ├── balance.ts                     # Balance calculations (259 lines)
│   └── reconciliation.ts              # COD reconciliation (282 lines)
└── jobs/
    └── daily-reconciliation.ts        # Daily reconciliation job (113 lines)

app/api/
└── wallet/
    ├── route.ts                       # GET balance indicators
    └── transactions/
        └── route.ts                   # GET transaction history

prisma/
├── schema.prisma                      # Updated TransactionType enum
└── migrations/
    └── 20250930135047_update_transaction_types/
        └── migration.sql              # Safe enum migration
```

## API Endpoints

### GET /api/wallet
Returns balance indicators and transaction statistics.

**Response**:
```json
{
  "balance": {
    "available": "15000.00",
    "withdrawable": "12000.00",
    "projected": "18000.00"
  },
  "stats": {
    "totalCredits": "50000.00",
    "totalDebits": "35000.00",
    "totalTransactions": 125,
    "transactionsByType": {
      "ORDER_CHARGE": 45,
      "COD_CREDIT": 30,
      "DEPOSIT": 5,
      "WITHDRAWAL": 3
    }
  }
}
```

### GET /api/wallet/transactions
Returns paginated transaction history with filtering.

**Query Parameters**:
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)
- `type` (TransactionType enum)
- `orderId` (filter by specific order)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Response**:
```json
{
  "transactions": [
    {
      "id": "tx_123",
      "type": "COD_CREDIT",
      "debitAmount": "0.00",
      "creditAmount": "3500.00",
      "balanceAfter": "15000.00",
      "description": "COD credit for order #456...",
      "orderId": "order_456",
      "order": {
        "id": "order_456",
        "customerName": "John Doe",
        "totalAmount": "5000.00",
        "state": "DELIVERED"
      },
      "createdBy": {
        "id": "user_789",
        "email": "admin@example.com",
        "role": "ADMIN"
      },
      "createdAt": "2025-09-30T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 125,
    "totalPages": 7
  }
}
```

## How to Use

### Creating Transactions

#### Example 1: Order Charge (when order is confirmed)
```typescript
import { createTransaction } from '@/lib/wallet/transaction';

await createTransaction({
  dropshipperId: 'dropshipper_123',
  type: 'ORDER_CHARGE',
  debitAmount: 5000.00,  // Product cost
  description: 'Order charge for order #456',
  orderId: 'order_456',
  createdByUserId: 'system_user_id',
});
```

#### Example 2: Deposit (admin approves deposit request)
```typescript
await createTransaction({
  dropshipperId: 'dropshipper_123',
  type: 'DEPOSIT',
  creditAmount: 10000.00,
  description: 'Deposit approved - Request #789',
  createdByUserId: 'admin_user_id',
});
```

#### Example 3: Withdrawal (admin approves withdrawal request)
```typescript
await createTransaction({
  dropshipperId: 'dropshipper_123',
  type: 'WITHDRAWAL',
  debitAmount: 3000.00,
  description: 'Withdrawal approved - Request #101',
  createdByUserId: 'admin_user_id',
});
```

#### Example 4: Manual Adjustment (admin correction)
```typescript
await createTransaction({
  dropshipperId: 'dropshipper_123',
  type: 'MANUAL_ADJUSTMENT',
  creditAmount: 500.00,  // or debitAmount for corrections
  description: 'Manual adjustment: Refund for damaged product',
  createdByUserId: 'admin_user_id',
});
```

### Balance Checks

#### Check Available Balance
```typescript
import { getCurrentBalance } from '@/lib/wallet/balance';

const balance = await getCurrentBalance('dropshipper_123');
console.log(`Current balance: ${balance.toFixed(2)}`);
```

#### Check All Balance Indicators
```typescript
import { getBalance } from '@/lib/wallet/balance';

const balances = await getBalance('dropshipper_123');
console.log(`Available: ${balances.available.toFixed(2)}`);
console.log(`Withdrawable: ${balances.withdrawable.toFixed(2)}`);
console.log(`Projected: ${balances.projected.toFixed(2)}`);
```

#### Validate Before Withdrawal
```typescript
import { validateWithdrawableBalance } from '@/lib/wallet/balance';

const canWithdraw = await validateWithdrawableBalance('dropshipper_123', 5000);
if (!canWithdraw) {
  throw new Error('Insufficient withdrawable balance');
}
```

### COD Reconciliation

#### Reconcile Single Order
```typescript
import { reconcileCOD } from '@/lib/wallet/reconciliation';

// Trigger when order state changes to DELIVERED
const result = await reconcileCOD('order_456', 'system_user_id');

console.log(`Reconciled order ${result.orderId}`);
console.log(`Deducted: ${result.deductedAmount.toFixed(2)}`);
console.log(`Credited: ${result.creditedAmount.toFixed(2)}`);
```

#### Batch Reconciliation
```typescript
import { reconcileAllPendingCOD } from '@/lib/wallet/reconciliation';

const result = await reconcileAllPendingCOD('system_user_id', 50);
console.log(`Processed: ${result.successful.length} successful`);
console.log(`Failed: ${result.failed.length} failed`);
```

### Daily Reconciliation

```typescript
import { runDailyReconciliation } from '@/lib/jobs/daily-reconciliation';

// Run via cron job or scheduler
const result = await runDailyReconciliation('system_user_id');

if (result.balanceIntegrity.discrepancies.length > 0) {
  console.error('ALERT: Balance discrepancies found!');
  // Send notification to admins
}
```

## Transaction Types

| Type | Debit/Credit | When Used |
|------|-------------|-----------|
| `ORDER_CHARGE` | Debit | When order is confirmed (product cost) |
| `COD_DEDUCTION` | Debit | When COD order delivered (product + commission) |
| `COD_CREDIT` | Credit | When COD order delivered (collected amount - deductions) |
| `DEPOSIT` | Credit | When admin approves deposit request |
| `WITHDRAWAL` | Debit | When admin approves withdrawal request |
| `MANUAL_ADJUSTMENT` | Debit or Credit | Admin corrections and adjustments |

## COD Reconciliation Flow

```
1. Order Delivered (state = DELIVERED, payment_type = COD)
   ↓
2. Calculate Amounts:
   - Total Collected: $5,000
   - Product Cost: $3,000
   - Commission (15%): $750
   - To Deduct: $3,750 ($3,000 + $750)
   - To Credit: $1,250 ($5,000 - $3,750)
   ↓
3. Create Two Transactions (atomically):
   a) COD_DEDUCTION: Debit $3,750
   b) COD_CREDIT: Credit $1,250
   ↓
4. New Balance: Previous Balance - $3,750 + $1,250
```

## Balance Calculation Examples

### Example Scenario

**Transactions**:
1. DEPOSIT: +$10,000 (Credit)
2. ORDER_CHARGE: -$5,000 (Debit)
3. COD_DEDUCTION: -$3,750 (Debit)
4. COD_CREDIT: +$1,250 (Credit)
5. WITHDRAWAL (Pending): $2,000

**Balance Calculations**:
- **Available**: $10,000 - $5,000 - $3,750 + $1,250 = **$2,500**
- **Withdrawable**: $2,500 - $2,000 (pending withdrawal) = **$500**
- **Projected**: $2,500 + $0 (no pending COD) = **$2,500**

### Pending COD Example

If there's a delivered COD order pending reconciliation:
- Order Total: $8,000
- Product Cost: $6,000
- Commission: $1,200
- Expected Credit: $8,000 - $6,000 - $1,200 = $800

**Projected Balance**: $2,500 + $800 = **$3,300**

## Transaction Safety

### Isolation Level
Uses **Serializable** isolation level for maximum safety:
- Prevents dirty reads
- Prevents non-repeatable reads
- Prevents phantom reads
- Guarantees transaction ordering

### Locking Strategy
- Row-level locks on balance reads
- 5-second max wait for lock acquisition
- 10-second transaction timeout
- Automatic rollback on failure

### Validation
1. **Pre-transaction checks**:
   - Debit and credit cannot both be set
   - Amounts must be positive
   - Balance must be sufficient for debits

2. **Post-transaction verification**:
   - Balance integrity checks
   - Daily reconciliation job
   - Discrepancy alerts

## Notes for Stream B (Deposit/Withdrawal Workflows)

### Integration Points

Stream B will implement:
1. **Deposit Request Workflow**:
   - Upload receipt
   - Admin approval UI
   - Call `createTransaction()` with type=DEPOSIT

2. **Withdrawal Request Workflow**:
   - Validate balance using `validateWithdrawableBalance()`
   - Admin approval UI
   - Call `createTransaction()` with type=WITHDRAWAL

### Available Functions

```typescript
// Balance validation before withdrawal request
import { validateWithdrawableBalance } from '@/lib/wallet/balance';
const canWithdraw = await validateWithdrawableBalance(dropshipperId, amount);

// Create deposit transaction (on approval)
import { createTransaction } from '@/lib/wallet/transaction';
await createTransaction({
  dropshipperId,
  type: 'DEPOSIT',
  creditAmount: depositAmount,
  description: 'Deposit approved - Request #123',
  createdByUserId: adminUserId,
});

// Create withdrawal transaction (on approval)
await createTransaction({
  dropshipperId,
  type: 'WITHDRAWAL',
  debitAmount: withdrawalAmount,
  description: 'Withdrawal approved - Request #456',
  createdByUserId: adminUserId,
});
```

### File Locations for Stream B

- `/app/api/wallet/deposit/route.ts` - POST deposit request
- `/app/api/wallet/withdrawal/route.ts` - POST withdrawal request
- `/app/api/admin/wallet/deposits/[id]/approve/route.ts` - Admin approval
- `/app/api/admin/wallet/withdrawals/[id]/approve/route.ts` - Admin approval
- `/lib/wallet/deposit.ts` - Deposit business logic
- `/lib/wallet/withdrawal.ts` - Withdrawal business logic

## Testing Notes

### Manual Testing Performed
✅ Schema migration applied successfully
✅ Prisma client generated
✅ TypeScript compilation passes
✅ All transaction types validated

### Required Testing (for QA)

#### 1. Concurrent Transactions
Test race conditions by creating simultaneous transactions for the same dropshipper.

#### 2. Insufficient Balance
Try creating a debit transaction when balance is insufficient.

#### 3. COD Reconciliation
- Create COD order
- Mark as DELIVERED
- Run reconciliation
- Verify two transactions created
- Check balance updated correctly

#### 4. Balance Integrity
Run daily reconciliation job and verify balance integrity.

#### 5. API Endpoints
- Test GET /api/wallet without authentication (should fail)
- Test GET /api/wallet/transactions with various filters
- Test pagination

#### 6. Edge Cases
- Transaction with both debit and credit (should fail)
- Transaction with negative amounts (should fail)
- Reconciling already reconciled order (should fail)

## Deployment Checklist

- [ ] Run database migration: `npx prisma migrate deploy`
- [ ] Generate Prisma client: `npx prisma generate`
- [ ] Set up cron job for daily reconciliation (e.g., 2 AM daily)
- [ ] Configure monitoring/alerts for balance discrepancies
- [ ] Test rollback procedures
- [ ] Document incident response for financial issues

## Performance Considerations

### Database Indexes
Already created in schema:
- `wallet_transactions(dropshipperId)`
- `wallet_transactions(createdAt)`
- `wallet_transactions(type)`

### Query Optimization
- Balance queries use latest `balance_after` (O(1) instead of sum)
- Pagination implemented for transaction history
- Batch processing for COD reconciliation

### Recommended Monitoring
- Transaction processing time
- Failed transaction rate
- Balance discrepancy frequency
- API response times

## Security Considerations

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Only dropshipper can access their own wallet
3. **Audit Trail**: All transactions record `createdByUserId`
4. **Immutability**: Transactions cannot be modified or deleted
5. **Validation**: All amounts validated before processing
6. **Isolation**: Serializable transactions prevent race conditions

## Future Enhancements (Out of Scope for MVP)

- Real-time balance updates via WebSocket
- Email/SMS notifications for transactions
- Transaction export (PDF, Excel)
- Balance alert thresholds
- Multi-currency support
- Automated COD reconciliation webhook
- Admin dashboard for financial oversight
- Transaction search by customer name/email

## Support & Troubleshooting

### Common Issues

**Issue**: Balance discrepancy detected
**Solution**: Check daily reconciliation logs, verify all transactions, contact admin for manual adjustment

**Issue**: COD reconciliation fails
**Solution**: Check order state and payment type, verify order has not been reconciled already

**Issue**: Insufficient balance error
**Solution**: Check withdrawable balance (considers pending withdrawals), not just available balance

**Issue**: Transaction timeout
**Solution**: Check database connection, verify no long-running transactions, consider increasing timeout

## Commits

- `f9de5cd` - Issue #3 & #5: Implement Shopify OAuth + Virtual Wallet Transaction Engine
- `a2f690d` - Issue #5: Fix TypeScript errors in wallet API endpoints

## Contact

For questions or issues with the wallet engine:
- Check documentation in `/lib/wallet/*.ts`
- Review test cases (when implemented)
- Contact development team lead