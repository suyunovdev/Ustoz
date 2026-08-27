-- Student panel performance indekslari (audit P1–P5, L2, L4).
-- Idempotent (IF NOT EXISTS) — bir necha marta xavfsiz qo'llanadi.

-- ── P1: pg_trgm — kurs qidiruvi ILIKE '%q%' uchun GIN trigram indeksi ──
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE INDEX IF NOT EXISTS "courses_title_idx" ON "courses" USING GIN ("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "courses_description_idx" ON "courses" USING GIN ("description" gin_trgm_ops);

-- ── P2: Marketplace saralash indekslari (isPublished bilan prefikslangan) ──
CREATE INDEX IF NOT EXISTS "courses_is_published_created_at_idx" ON "courses" ("is_published", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "courses_is_published_rating_idx" ON "courses" ("is_published", "rating" DESC);
CREATE INDEX IF NOT EXISTS "courses_is_published_enrollment_count_idx" ON "courses" ("is_published", "enrollment_count" DESC);
CREATE INDEX IF NOT EXISTS "courses_is_published_price_uzs_idx" ON "courses" ("is_published", "price_uzs");

-- ── P3: Legacy 'category' string filtri ──
CREATE INDEX IF NOT EXISTS "courses_category_idx" ON "courses" ("category");

-- ── P5: Notifications inbox (recipientId+status, recipientId+createdAt DESC) ──
CREATE INDEX IF NOT EXISTS "notifications_recipient_id_status_idx" ON "notifications" ("recipient_id", "status");
CREATE INDEX IF NOT EXISTS "notifications_recipient_id_created_at_idx" ON "notifications" ("recipient_id", "created_at" DESC);

-- ── L2: Talaba topshiriqlari (courseId + status) ──
CREATE INDEX IF NOT EXISTS "assignments_course_id_status_idx" ON "assignments" ("course_id", "status");

-- ── L4: Talaba sertifikatlari (studentId + status) ──
CREATE INDEX IF NOT EXISTS "certificates_student_id_status_idx" ON "certificates" ("student_id", "status");
