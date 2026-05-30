-- ============================================================
-- Direct messages: teacher ↔ student 1-1 conversations
-- ============================================================

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "teacher_id" UUID NOT NULL,
  "student_id" UUID NOT NULL,
  "course_id" UUID,
  "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_message_preview" TEXT,
  "last_message_sender_id" UUID,
  "teacher_unread_count" INTEGER NOT NULL DEFAULT 0,
  "student_unread_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- 1-1 unique constraint (teacher-student pairing)
CREATE UNIQUE INDEX IF NOT EXISTS "conversations_teacher_student_key"
  ON "conversations"("teacher_id", "student_id");

CREATE INDEX IF NOT EXISTS "conversations_teacher_last_msg_idx"
  ON "conversations"("teacher_id", "last_message_at" DESC);
CREATE INDEX IF NOT EXISTS "conversations_student_last_msg_idx"
  ON "conversations"("student_id", "last_message_at" DESC);

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_teacher_id_fkey"
  FOREIGN KEY ("teacher_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_student_id_fkey"
  FOREIGN KEY ("student_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_course_id_fkey"
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DirectMessage
CREATE TABLE IF NOT EXISTS "direct_messages" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "conversation_id" UUID NOT NULL,
  "sender_id" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "direct_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "direct_messages_conv_created_idx"
  ON "direct_messages"("conversation_id", "created_at");
CREATE INDEX IF NOT EXISTS "direct_messages_sender_idx"
  ON "direct_messages"("sender_id");

ALTER TABLE "direct_messages"
  ADD CONSTRAINT "direct_messages_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "direct_messages"
  ADD CONSTRAINT "direct_messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
