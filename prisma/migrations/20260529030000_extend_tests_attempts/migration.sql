-- ============================================================
-- Extend tests: question types, points, attempts, time limits
-- ============================================================

-- CourseTest: add topic link, time limit, attempts, status
ALTER TABLE "course_tests"
  ADD COLUMN IF NOT EXISTS "topic_id" UUID,
  ADD COLUMN IF NOT EXISTS "time_limit_sec" INTEGER,
  ADD COLUMN IF NOT EXISTS "allowed_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS "randomize_questions" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "show_correct_answers" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "total_points" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "course_tests_topic_id_idx" ON "course_tests"("topic_id");
CREATE INDEX IF NOT EXISTS "course_tests_status_idx" ON "course_tests"("status");

-- FK (course_topics ON DELETE SET NULL — savol topic'siz qolsa ham yashasa bo'ladi)
ALTER TABLE "course_tests"
  ADD CONSTRAINT "course_tests_topic_id_fkey"
  FOREIGN KEY ("topic_id") REFERENCES "course_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- TestQuestion: yangi turlari, points, options JSON
ALTER TABLE "test_questions"
  ADD COLUMN IF NOT EXISTS "question_type" TEXT NOT NULL DEFAULT 'single',
  ADD COLUMN IF NOT EXISTS "points" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "options" JSONB,
  ADD COLUMN IF NOT EXISTS "correct_answers" JSONB;

-- Eski A/B/C/D/correctAnswer maydonlarini nullable qilish (yangi turlar uchun)
ALTER TABLE "test_questions"
  ALTER COLUMN "option_a" DROP NOT NULL,
  ALTER COLUMN "option_b" DROP NOT NULL,
  ALTER COLUMN "option_c" DROP NOT NULL,
  ALTER COLUMN "option_d" DROP NOT NULL,
  ALTER COLUMN "correct_answer" DROP NOT NULL;

-- ============================================================
-- TestAttempt — talaba test topshirgani
-- ============================================================
CREATE TABLE IF NOT EXISTS "test_attempts" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "test_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "attempt_number" INTEGER NOT NULL,
  "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submitted_at" TIMESTAMP(3),
  "score" INTEGER NOT NULL DEFAULT 0,
  "max_score" INTEGER NOT NULL DEFAULT 0,
  "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
  "passed" BOOLEAN NOT NULL DEFAULT FALSE,
  "answers" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'in_progress',
  CONSTRAINT "test_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "test_attempts_test_id_idx" ON "test_attempts"("test_id");
CREATE INDEX IF NOT EXISTS "test_attempts_student_id_idx" ON "test_attempts"("student_id");
CREATE INDEX IF NOT EXISTS "test_attempts_test_student_idx" ON "test_attempts"("test_id", "student_id");
CREATE INDEX IF NOT EXISTS "test_attempts_submitted_at_idx" ON "test_attempts"("submitted_at");

ALTER TABLE "test_attempts"
  ADD CONSTRAINT "test_attempts_test_id_fkey"
  FOREIGN KEY ("test_id") REFERENCES "course_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "test_attempts"
  ADD CONSTRAINT "test_attempts_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
