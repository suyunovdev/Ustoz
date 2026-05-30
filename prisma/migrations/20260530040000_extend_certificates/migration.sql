-- ============================================================
-- Extend certificates: snapshots, status, revocation, issuer
-- ============================================================

ALTER TABLE "certificates"
  ADD COLUMN IF NOT EXISTS "student_name_snapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "course_title_snapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "teacher_name_snapshot" TEXT,
  ADD COLUMN IF NOT EXISTS "final_grade" INTEGER,
  ADD COLUMN IF NOT EXISTS "completion_percent" INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS "issued_by_id" UUID,
  ADD COLUMN IF NOT EXISTS "issue_source" TEXT NOT NULL DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS "revoked_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "revoke_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "revoked_by_id" UUID;

CREATE INDEX IF NOT EXISTS "certificates_status_idx" ON "certificates"("status");
CREATE INDEX IF NOT EXISTS "certificates_issued_at_idx" ON "certificates"("issued_at");

ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_issued_by_id_fkey"
  FOREIGN KEY ("issued_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_revoked_by_id_fkey"
  FOREIGN KEY ("revoked_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
