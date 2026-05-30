-- ============================================================
-- Affiliate / Referral system
-- ============================================================

-- UserProfile extension: referral kodi va ulanish
ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "referral_code" VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS "referred_by_id" UUID,
  ADD COLUMN IF NOT EXISTS "referral_clicks" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "referred_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "user_profiles_referred_by_id_idx" ON "user_profiles"("referred_by_id");
CREATE INDEX IF NOT EXISTS "user_profiles_referral_code_idx" ON "user_profiles"("referral_code");

ALTER TABLE "user_profiles"
  ADD CONSTRAINT "user_profiles_referred_by_id_fkey"
  FOREIGN KEY ("referred_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Referral earnings — har bir referred talaba to'lov qilganda yoziladi
CREATE TABLE IF NOT EXISTS "referral_earnings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "referrer_id" UUID NOT NULL,
  "referred_user_id" UUID NOT NULL,
  "source_transaction_id" UUID,
  "course_id" UUID,
  "amount_uzs" BIGINT NOT NULL,
  "commission_pct" INTEGER NOT NULL DEFAULT 10,
  -- 'pending' | 'paid' | 'cancelled'
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "paid_at" TIMESTAMP(3),
  CONSTRAINT "referral_earnings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_earnings_referrer_id_idx" ON "referral_earnings"("referrer_id");
CREATE INDEX IF NOT EXISTS "referral_earnings_status_idx" ON "referral_earnings"("status");
CREATE INDEX IF NOT EXISTS "referral_earnings_created_at_idx" ON "referral_earnings"("created_at");
-- Bitta transaction'dan ikki marta earning yozmaslik uchun
CREATE UNIQUE INDEX IF NOT EXISTS "referral_earnings_source_unique"
  ON "referral_earnings"("source_transaction_id")
  WHERE "source_transaction_id" IS NOT NULL;

ALTER TABLE "referral_earnings"
  ADD CONSTRAINT "referral_earnings_referrer_id_fkey"
  FOREIGN KEY ("referrer_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_earnings"
  ADD CONSTRAINT "referral_earnings_referred_user_id_fkey"
  FOREIGN KEY ("referred_user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "referral_earnings"
  ADD CONSTRAINT "referral_earnings_source_transaction_id_fkey"
  FOREIGN KEY ("source_transaction_id") REFERENCES "payment_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "referral_earnings"
  ADD CONSTRAINT "referral_earnings_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
