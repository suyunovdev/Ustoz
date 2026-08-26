-- Jonli darslar / vebinarlar (#5 obuna qiymati)
CREATE TABLE "live_sessions" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "subject" TEXT,
  "host_name" TEXT NOT NULL,
  "cover_image" TEXT,
  "starts_at" TIMESTAMP(3) NOT NULL,
  "duration_min" INTEGER NOT NULL DEFAULT 60,
  "meeting_url" TEXT NOT NULL,
  "is_published" BOOLEAN NOT NULL DEFAULT true,
  "created_by_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "live_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "live_sessions_starts_at_idx" ON "live_sessions"("starts_at");
CREATE INDEX "live_sessions_is_published_idx" ON "live_sessions"("is_published");
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
