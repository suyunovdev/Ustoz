-- Prod qo'lda migratsiya: course_purchase_requests jadvali
-- CoursePurchaseRequest modeli uchun (kurs sotib olish so'rovi → admin tasdig'i oqimi)
-- Idempotent: qayta ishga tushirsa xato bermaydi.

CREATE TABLE IF NOT EXISTS "course_purchase_requests" (
  "id"             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"        UUID NOT NULL,
  "course_id"      UUID NOT NULL,
  "status"         TEXT NOT NULL DEFAULT 'pending',
  "payment_method" TEXT,
  "reviewed_by_id" UUID,
  "reviewed_at"    TIMESTAMP(3),
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "course_purchase_requests_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "course_purchase_requests_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "course_purchase_requests_user_id_idx"
  ON "course_purchase_requests" ("user_id");

CREATE INDEX IF NOT EXISTS "course_purchase_requests_status_idx"
  ON "course_purchase_requests" ("status");
