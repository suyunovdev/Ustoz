-- ============================================================
-- Extend assignments: topic link, status, late policy, types
-- ============================================================

ALTER TABLE "assignments"
  ADD COLUMN IF NOT EXISTS "topic_id" UUID,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "instructions" TEXT,
  ADD COLUMN IF NOT EXISTS "submission_type" TEXT NOT NULL DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS "allow_late_submission" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "late_penalty_percent" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "submission_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "assignments_topic_id_idx" ON "assignments"("topic_id");
CREATE INDEX IF NOT EXISTS "assignments_status_idx" ON "assignments"("status");
CREATE INDEX IF NOT EXISTS "assignments_due_date_idx" ON "assignments"("due_date");

ALTER TABLE "assignments"
  ADD CONSTRAINT "assignments_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "course_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================
-- AssignmentSubmission: status, attachments, isLate
-- ============================================================

ALTER TABLE "assignment_submissions"
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS "attachments" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "is_late" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "revision_number" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "assignment_submissions_status_idx" ON "assignment_submissions"("status");
CREATE INDEX IF NOT EXISTS "assignment_submissions_assignment_student_idx"
  ON "assignment_submissions"("assignment_id", "student_id");
