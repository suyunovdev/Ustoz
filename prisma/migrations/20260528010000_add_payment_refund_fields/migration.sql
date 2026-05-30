ALTER TABLE "payment_transactions"
  ADD COLUMN "refunded_at" TIMESTAMP(3),
  ADD COLUMN "refund_reason" TEXT,
  ADD COLUMN "refunded_by_id" UUID;
CREATE INDEX "payment_transactions_created_at_idx" ON "payment_transactions"("created_at");
