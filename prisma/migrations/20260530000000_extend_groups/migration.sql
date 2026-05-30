-- Extend Group: meeting URL, schedule note, color, member count cache
ALTER TABLE "groups"
  ADD COLUMN IF NOT EXISTS "meeting_url" TEXT,
  ADD COLUMN IF NOT EXISTS "schedule_note" TEXT,
  ADD COLUMN IF NOT EXISTS "color" TEXT NOT NULL DEFAULT 'blue',
  ADD COLUMN IF NOT EXISTS "member_count" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "groups_course_id_idx" ON "groups"("course_id");
CREATE INDEX IF NOT EXISTS "groups_status_idx" ON "groups"("status");

-- GroupMember already has FK to groups; we just don't expose student FK in schema.prisma
-- Prisma will use studentId field without explicit relation (we'll add to schema.prisma)
