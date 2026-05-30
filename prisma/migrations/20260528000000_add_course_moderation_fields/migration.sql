-- AlterTable: Course moderation fields
ALTER TABLE "courses"
  ADD COLUMN "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'draft',
  ADD COLUMN "admin_feedback" TEXT,
  ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reviewed_by_id" UUID,
  ADD COLUMN "reviewed_at" TIMESTAMP(3),
  ADD COLUMN "suspended_at" TIMESTAMP(3),
  ADD COLUMN "suspend_reason" TEXT;

-- Backfill: mavjud published kurslar approved deb belgilanadi
UPDATE "courses" SET "moderation_status" = 'approved' WHERE "is_published" = true;

-- Indexes
CREATE INDEX "courses_moderation_status_idx" ON "courses"("moderation_status");
CREATE INDEX "courses_is_featured_idx" ON "courses"("is_featured");
