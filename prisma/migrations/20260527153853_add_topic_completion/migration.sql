-- Drift fix: otp_codes.email FK earlier removed manually (signup uchun user hali yo'q edi).
-- IF EXISTS bilan idempotent.
ALTER TABLE "otp_codes" DROP CONSTRAINT IF EXISTS "otp_codes_email_fkey";

-- CreateTable
CREATE TABLE "topic_completions" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watch_time_sec" INTEGER,

    CONSTRAINT "topic_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "topic_completions_student_id_course_id_idx" ON "topic_completions"("student_id", "course_id");

-- CreateIndex
CREATE INDEX "topic_completions_student_id_completed_at_idx" ON "topic_completions"("student_id", "completed_at");

-- CreateIndex
CREATE UNIQUE INDEX "topic_completions_student_id_topic_id_key" ON "topic_completions"("student_id", "topic_id");

-- AddForeignKey
ALTER TABLE "topic_completions" ADD CONSTRAINT "topic_completions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_completions" ADD CONSTRAINT "topic_completions_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "course_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_completions" ADD CONSTRAINT "topic_completions_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
