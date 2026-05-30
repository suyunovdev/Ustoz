-- ============================================================
-- User profile extensions: notification prefs + deletion requests
-- ============================================================

ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "notification_prefs" JSONB NOT NULL DEFAULT '{
    "email_enrollment": true,
    "email_assignment_submission": true,
    "email_quiz_completion": false,
    "email_course_update": true,
    "email_achievement": false,
    "email_payment": true,
    "email_message": true,
    "email_review": true,
    "in_app_enabled": true
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS "headline" TEXT,
  ADD COLUMN IF NOT EXISTS "expertise" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "social_links" JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS "deletion_requested_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "deletion_reason" TEXT;

CREATE INDEX IF NOT EXISTS "user_profiles_deletion_requested_at_idx"
  ON "user_profiles"("deletion_requested_at")
  WHERE "deletion_requested_at" IS NOT NULL;
