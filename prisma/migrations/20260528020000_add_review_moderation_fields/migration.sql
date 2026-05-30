ALTER TABLE "course_reviews"
  ADD COLUMN "hidden_at" TIMESTAMP(3),
  ADD COLUMN "hide_reason" TEXT,
  ADD COLUMN "hidden_by_id" UUID,
  ADD COLUMN "report_count" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "course_reviews_hidden_at_idx" ON "course_reviews"("hidden_at");
CREATE INDEX "course_reviews_report_count_idx" ON "course_reviews"("report_count");
