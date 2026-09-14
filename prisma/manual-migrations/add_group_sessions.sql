-- Guruh jonli darslari (GroupSession) + davomat (GroupSessionAttendance) + live_session bildirishnoma turi.
-- Prod'da qo'lda qo'llanadi (schema drift sababli prisma migrate ishlatilmaydi).
-- MUHIM: ALTER TYPE ... ADD VALUE tranzaksiyadan TASHQARIDA (autocommit) bajarilishi kerak.
--
-- Qo'llash: psql "$DATABASE_URL" -f add_group_sessions.sql
-- Enum tur nomini avval tekshiring: \dT  (odatda "NotificationType").

-- 1) Bildirishnoma turiga live_session qo'shish (autocommit — alohida)
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'live_session';

-- 2) group_sessions jadvali
CREATE TABLE IF NOT EXISTS "group_sessions" (
    "id"               UUID         NOT NULL,
    "group_id"         UUID         NOT NULL,
    "title"            TEXT         NOT NULL,
    "starts_at"        TIMESTAMP(3) NOT NULL,
    "duration_min"     INTEGER      NOT NULL DEFAULT 60,
    "meeting_url"      TEXT         NOT NULL,
    "status"           TEXT         NOT NULL DEFAULT 'scheduled',
    "series_id"        UUID,
    "reminder_sent_at" TIMESTAMP(3),
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "group_sessions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "group_sessions_group_id_idx"  ON "group_sessions"("group_id");
CREATE INDEX IF NOT EXISTS "group_sessions_starts_at_idx" ON "group_sessions"("starts_at");
CREATE INDEX IF NOT EXISTS "group_sessions_status_idx"    ON "group_sessions"("status");
CREATE INDEX IF NOT EXISTS "group_sessions_series_id_idx" ON "group_sessions"("series_id");
ALTER TABLE "group_sessions"
    ADD CONSTRAINT "group_sessions_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3) group_session_attendance jadvali
CREATE TABLE IF NOT EXISTS "group_session_attendance" (
    "id"         UUID         NOT NULL,
    "session_id" UUID         NOT NULL,
    "student_id" UUID         NOT NULL,
    "joined_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_session_attendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "group_session_attendance_session_id_student_id_key"
    ON "group_session_attendance"("session_id", "student_id");
CREATE INDEX IF NOT EXISTS "group_session_attendance_student_id_idx"
    ON "group_session_attendance"("student_id");
ALTER TABLE "group_session_attendance"
    ADD CONSTRAINT "group_session_attendance_session_id_fkey"
    FOREIGN KEY ("session_id") REFERENCES "group_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
