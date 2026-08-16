-- payment_transactions: obuna to'lovlarini qo'llab-quvvatlash
ALTER TABLE "payment_transactions" ALTER COLUMN "course_id" DROP NOT NULL;
ALTER TABLE "payment_transactions" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'course';
ALTER TABLE "payment_transactions" ADD COLUMN "plan_id" UUID;

-- subscription_plans
CREATE TABLE "subscription_plans" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price_uzs" BIGINT NOT NULL,
  "duration_days" INTEGER NOT NULL,
  "tier" INTEGER NOT NULL DEFAULT 0,
  "features" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "all_courses_access" BOOLEAN NOT NULL DEFAULT true,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "subscription_plans_is_active_idx" ON "subscription_plans"("is_active");

-- subscriptions
CREATE TABLE "subscriptions" (
  "id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "source_transaction_id" UUID,
  "auto_renew" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");
CREATE INDEX "subscriptions_expires_at_idx" ON "subscriptions"("expires_at");

-- Foreign keys
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
