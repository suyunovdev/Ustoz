-- Add view tracking + R2 storage + versioning to content_materials

ALTER TABLE "content_materials"
  ADD COLUMN IF NOT EXISTS "view_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "storage_type" TEXT NOT NULL DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS "r2_key" TEXT,
  ADD COLUMN IF NOT EXISTS "current_version" INTEGER NOT NULL DEFAULT 1;

-- Per-view event log (for analytics, anti-abuse, watch time)
CREATE TABLE IF NOT EXISTS "material_views" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "material_id" UUID NOT NULL,
  "student_id" UUID,
  "watch_sec" INTEGER,
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "material_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "material_views_material_id_idx" ON "material_views"("material_id");
CREATE INDEX IF NOT EXISTS "material_views_material_id_created_at_idx" ON "material_views"("material_id", "created_at");
CREATE INDEX IF NOT EXISTS "material_views_student_id_idx" ON "material_views"("student_id");

ALTER TABLE "material_views"
  ADD CONSTRAINT "material_views_material_id_fkey"
  FOREIGN KEY ("material_id") REFERENCES "content_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "material_views"
  ADD CONSTRAINT "material_views_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Version history (when a material's file is replaced)
CREATE TABLE IF NOT EXISTS "material_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "material_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "file_url" TEXT,
  "file_name" TEXT,
  "file_size" BIGINT,
  "file_type" TEXT,
  "material_type" TEXT,
  "replaced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "replaced_by" UUID NOT NULL,
  CONSTRAINT "material_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "material_versions_material_id_version_key" ON "material_versions"("material_id", "version");
CREATE INDEX IF NOT EXISTS "material_versions_material_id_idx" ON "material_versions"("material_id");

ALTER TABLE "material_versions"
  ADD CONSTRAINT "material_versions_material_id_fkey"
  FOREIGN KEY ("material_id") REFERENCES "content_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "material_versions"
  ADD CONSTRAINT "material_versions_replaced_by_fkey"
  FOREIGN KEY ("replaced_by") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
