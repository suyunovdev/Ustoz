-- ============================================================
-- Teacher withdrawals — pul yechib olish so'rovlari
-- ============================================================

CREATE TABLE IF NOT EXISTS "teacher_withdrawals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "teacher_id" UUID NOT NULL,
  "amount_uzs" BIGINT NOT NULL,
  -- 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled'
  "status" TEXT NOT NULL DEFAULT 'pending',
  "method" TEXT NOT NULL DEFAULT 'bank_transfer',  -- bank_transfer | card
  -- Bank ma'lumotlari
  "bank_name" TEXT,
  "bank_account_number" TEXT,
  "card_number" TEXT,                              -- masked (last 4 digits)
  "recipient_name" TEXT,
  -- Audit / processing
  "note" TEXT,                                     -- teacher uchun izoh
  "admin_note" TEXT,                               -- admin javobi/sabab
  "rejection_reason" TEXT,
  "processed_by_id" UUID,
  "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "cancelled_at" TIMESTAMP(3),
  CONSTRAINT "teacher_withdrawals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "teacher_withdrawals_teacher_id_idx" ON "teacher_withdrawals"("teacher_id");
CREATE INDEX IF NOT EXISTS "teacher_withdrawals_status_idx" ON "teacher_withdrawals"("status");
CREATE INDEX IF NOT EXISTS "teacher_withdrawals_requested_at_idx" ON "teacher_withdrawals"("requested_at");

ALTER TABLE "teacher_withdrawals"
  ADD CONSTRAINT "teacher_withdrawals_teacher_id_fkey"
  FOREIGN KEY ("teacher_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teacher_withdrawals"
  ADD CONSTRAINT "teacher_withdrawals_processed_by_id_fkey"
  FOREIGN KEY ("processed_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Teacher bank/payout sozlamalari (default for future withdrawals)
ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "payout_bank_name" TEXT,
  ADD COLUMN IF NOT EXISTS "payout_account_number" TEXT,
  ADD COLUMN IF NOT EXISTS "payout_recipient_name" TEXT,
  ADD COLUMN IF NOT EXISTS "payout_card_number" TEXT;
