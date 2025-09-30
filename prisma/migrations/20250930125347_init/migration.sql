-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'DROPSHIPPER', 'SUPPORT');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."SupplierStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."ProductVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('TC', 'COD');

-- CreateEnum
CREATE TYPE "public"."OrderState" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('SALE_COMMISSION', 'DEPOSIT', 'WITHDRAWAL', 'REFUND', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."DepositStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "public"."ShopifyStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ERROR');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dropshipper_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "address" TEXT,
    "commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.15,
    "afip_validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dropshipper_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."suppliers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cuit" TEXT,
    "contact_email" TEXT,
    "status" "public"."SupplierStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."warehouses" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "operating_hours" TEXT,
    "capacity" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cost_price" DECIMAL(12,2) NOT NULL,
    "suggested_price" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "weight" DECIMAL(10,2),
    "dimensions" JSONB,
    "supplier_id" TEXT NOT NULL,
    "visibility_type" "public"."ProductVisibility" NOT NULL DEFAULT 'PUBLIC',
    "images_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."orders" (
    "id" TEXT NOT NULL,
    "dropshipper_id" TEXT NOT NULL,
    "shopify_order_id" TEXT,
    "store_id" TEXT,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "shipping_address" JSONB NOT NULL,
    "payment_type" "public"."PaymentType" NOT NULL,
    "state" "public"."OrderState" NOT NULL DEFAULT 'PENDING',
    "total_amount" DECIMAL(12,2) NOT NULL,
    "product_cost" DECIMAL(12,2) NOT NULL,
    "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."order_events" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "from_state" "public"."OrderState",
    "to_state" "public"."OrderState" NOT NULL,
    "changed_by_user_id" TEXT NOT NULL,
    "reason" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_transactions" (
    "id" TEXT NOT NULL,
    "dropshipper_id" TEXT NOT NULL,
    "type" "public"."TransactionType" NOT NULL,
    "debit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "order_id" TEXT,
    "description" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."deposit_requests" (
    "id" TEXT NOT NULL,
    "dropshipper_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "receipt_url" TEXT,
    "observations" TEXT,
    "status" "public"."DepositStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."withdrawal_requests" (
    "id" TEXT NOT NULL,
    "dropshipper_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "status" "public"."WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_user_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bank_accounts" (
    "id" TEXT NOT NULL,
    "dropshipper_id" TEXT NOT NULL,
    "cbu" TEXT NOT NULL,
    "alias" TEXT,
    "account_holder" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shopify_connections" (
    "id" TEXT NOT NULL,
    "dropshipper_id" TEXT NOT NULL,
    "shop_domain" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "status" "public"."ShopifyStatus" NOT NULL DEFAULT 'ACTIVE',
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopify_connections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dropshipper_profiles_user_id_key" ON "public"."dropshipper_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "dropshipper_profiles_cuit_key" ON "public"."dropshipper_profiles"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_code_key" ON "public"."suppliers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "public"."products"("sku");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "public"."products"("supplier_id");

-- CreateIndex
CREATE INDEX "products_stock_idx" ON "public"."products"("stock");

-- CreateIndex
CREATE UNIQUE INDEX "orders_shopify_order_id_key" ON "public"."orders"("shopify_order_id");

-- CreateIndex
CREATE INDEX "orders_dropshipper_id_idx" ON "public"."orders"("dropshipper_id");

-- CreateIndex
CREATE INDEX "orders_state_idx" ON "public"."orders"("state");

-- CreateIndex
CREATE INDEX "orders_created_at_idx" ON "public"."orders"("created_at");

-- CreateIndex
CREATE INDEX "orders_shopify_order_id_idx" ON "public"."orders"("shopify_order_id");

-- CreateIndex
CREATE INDEX "order_events_order_id_idx" ON "public"."order_events"("order_id");

-- CreateIndex
CREATE INDEX "order_events_created_at_idx" ON "public"."order_events"("created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_dropshipper_id_idx" ON "public"."wallet_transactions"("dropshipper_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_created_at_idx" ON "public"."wallet_transactions"("created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "public"."wallet_transactions"("type");

-- CreateIndex
CREATE INDEX "deposit_requests_dropshipper_id_idx" ON "public"."deposit_requests"("dropshipper_id");

-- CreateIndex
CREATE INDEX "deposit_requests_status_idx" ON "public"."deposit_requests"("status");

-- CreateIndex
CREATE INDEX "deposit_requests_created_at_idx" ON "public"."deposit_requests"("created_at");

-- CreateIndex
CREATE INDEX "withdrawal_requests_dropshipper_id_idx" ON "public"."withdrawal_requests"("dropshipper_id");

-- CreateIndex
CREATE INDEX "withdrawal_requests_status_idx" ON "public"."withdrawal_requests"("status");

-- CreateIndex
CREATE INDEX "withdrawal_requests_created_at_idx" ON "public"."withdrawal_requests"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "bank_accounts_dropshipper_id_cbu_key" ON "public"."bank_accounts"("dropshipper_id", "cbu");

-- CreateIndex
CREATE INDEX "shopify_connections_dropshipper_id_idx" ON "public"."shopify_connections"("dropshipper_id");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_connections_dropshipper_id_shop_domain_key" ON "public"."shopify_connections"("dropshipper_id", "shop_domain");

-- AddForeignKey
ALTER TABLE "public"."dropshipper_profiles" ADD CONSTRAINT "dropshipper_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."warehouses" ADD CONSTRAINT "warehouses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_dropshipper_id_fkey" FOREIGN KEY ("dropshipper_id") REFERENCES "public"."dropshipper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_events" ADD CONSTRAINT "order_events_changed_by_user_id_fkey" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_dropshipper_id_fkey" FOREIGN KEY ("dropshipper_id") REFERENCES "public"."dropshipper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_transactions" ADD CONSTRAINT "wallet_transactions_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposit_requests" ADD CONSTRAINT "deposit_requests_dropshipper_id_fkey" FOREIGN KEY ("dropshipper_id") REFERENCES "public"."dropshipper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."deposit_requests" ADD CONSTRAINT "deposit_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_dropshipper_id_fkey" FOREIGN KEY ("dropshipper_id") REFERENCES "public"."dropshipper_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bank_accounts" ADD CONSTRAINT "bank_accounts_dropshipper_id_fkey" FOREIGN KEY ("dropshipper_id") REFERENCES "public"."dropshipper_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shopify_connections" ADD CONSTRAINT "shopify_connections_dropshipper_id_fkey" FOREIGN KEY ("dropshipper_id") REFERENCES "public"."dropshipper_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
