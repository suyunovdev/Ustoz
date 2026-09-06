-- Audit tuzatishlari — prod qo'lda migratsiya (idempotent).
-- Wave 1 + Wave 4 schema o'zgarishlari. ssh xoztovar → psql "$DATABASE_URL" -f bu-fayl.

-- 1) Kurs sotib olish so'roviga chegirmali narx snapshot'i (Wave 1).
ALTER TABLE "course_purchase_requests"
  ADD COLUMN IF NOT EXISTS "price_uzs_snapshot" BIGINT;

-- 2) Enrollment manbai: 'direct' (doimiy) yoki 'subscription' (obuna tugasa kirish to'xtaydi).
ALTER TABLE "enrollments"
  ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'direct';

-- 3) Moliyaviy yozuvni saqlash: kurs o'chirilsa payment_transactions.course_id NULL bo'lsin
--    (Cascade emas, SetNull). Eski FK'ni topib, qayta yaratamiz.
DO $$
DECLARE fk_name text;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'payment_transactions'::regclass
    AND contype = 'f'
    AND confrelid = 'courses'::regclass;
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE "payment_transactions" DROP CONSTRAINT %I', fk_name);
  END IF;
  ALTER TABLE "payment_transactions"
    ADD CONSTRAINT "payment_transactions_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
END $$;

-- 4) Poyga (race) himoyasi — DB darajasida partial unique indekslar:
--    a) bitta user + kurs uchun faqat bitta 'pending' sotib olish so'rovi
CREATE UNIQUE INDEX IF NOT EXISTS "cpr_one_pending_per_user_course"
  ON "course_purchase_requests" ("user_id", "course_id")
  WHERE "status" = 'pending';

--    b) bitta user uchun faqat bitta 'pending' obuna so'rovi
CREATE UNIQUE INDEX IF NOT EXISTS "subreq_one_pending_per_user"
  ON "subscription_requests" ("user_id")
  WHERE "status" = 'pending';

--    c) bitta user uchun faqat bitta 'active' obuna
CREATE UNIQUE INDEX IF NOT EXISTS "sub_one_active_per_user"
  ON "subscriptions" ("user_id")
  WHERE "status" = 'active';
