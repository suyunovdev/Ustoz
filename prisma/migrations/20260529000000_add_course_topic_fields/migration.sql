ALTER TABLE "course_topics"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "video_url" TEXT,
  ADD COLUMN "is_free_preview" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "is_locked" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "course_topics_course_id_order_index_idx" ON "course_topics"("course_id", "order_index");
