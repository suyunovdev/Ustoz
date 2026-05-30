-- ============================================================
-- Extend reviews: teacher reply + helpful tracking
-- ============================================================

ALTER TABLE "course_reviews"
  ADD COLUMN IF NOT EXISTS "teacher_reply" TEXT,
  ADD COLUMN IF NOT EXISTS "teacher_reply_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "teacher_reply_edited_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "course_reviews_rating_idx" ON "course_reviews"("rating");
CREATE INDEX IF NOT EXISTS "course_reviews_created_at_idx" ON "course_reviews"("created_at");

-- ReviewHelpful — kim "foydali" deb belgilaganini tracking
CREATE TABLE IF NOT EXISTS "review_helpful_votes" (
  "review_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "review_helpful_votes_pkey" PRIMARY KEY ("review_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "review_helpful_votes_user_idx" ON "review_helpful_votes"("user_id");

ALTER TABLE "review_helpful_votes"
  ADD CONSTRAINT "review_helpful_votes_review_id_fkey"
  FOREIGN KEY ("review_id") REFERENCES "course_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "review_helpful_votes"
  ADD CONSTRAINT "review_helpful_votes_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
