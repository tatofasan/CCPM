-- AlterEnum: Update TransactionType enum
-- Create new enum type
CREATE TYPE "TransactionType_new" AS ENUM ('ORDER_CHARGE', 'COD_DEDUCTION', 'COD_CREDIT', 'DEPOSIT', 'WITHDRAWAL', 'MANUAL_ADJUSTMENT');

-- Migrate existing data to new enum values using CASE
ALTER TABLE "wallet_transactions"
  ALTER COLUMN "type" TYPE "TransactionType_new"
  USING (
    CASE "type"::text
      WHEN 'SALE_COMMISSION' THEN 'ORDER_CHARGE'
      WHEN 'DEPOSIT' THEN 'DEPOSIT'
      WHEN 'WITHDRAWAL' THEN 'WITHDRAWAL'
      WHEN 'REFUND' THEN 'MANUAL_ADJUSTMENT'
      WHEN 'ADJUSTMENT' THEN 'MANUAL_ADJUSTMENT'
      ELSE 'MANUAL_ADJUSTMENT'
    END::"TransactionType_new"
  );

-- Drop old enum and rename new one
DROP TYPE "TransactionType";
ALTER TYPE "TransactionType_new" RENAME TO "TransactionType";