-- O'quv interfeysi muhokamasi (mavzu izohlari)
CREATE TABLE IF NOT EXISTS "topic_comments" (
    "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
    "topic_id"   UUID NOT NULL,
    "user_id"    UUID NOT NULL,
    "body"       TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "topic_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "topic_comments_topic_id_idx" ON "topic_comments"("topic_id");

DO $$ BEGIN
    ALTER TABLE "topic_comments"
        ADD CONSTRAINT "topic_comments_topic_id_fkey"
        FOREIGN KEY ("topic_id") REFERENCES "course_topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE "topic_comments"
        ADD CONSTRAINT "topic_comments_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
