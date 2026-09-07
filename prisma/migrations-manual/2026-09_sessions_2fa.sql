-- Profil: faol qurilmalar (sessiyalar) + 2FA — prod qo'lda migratsiya (idempotent).

-- 1) Faol sessiyalar (qurilmalar)
CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    UUID NOT NULL,
  "token_id"   TEXT NOT NULL UNIQUE,
  "user_agent" TEXT,
  "ip"         TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revoked_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx" ON "user_sessions" ("user_id");

-- 2) 2FA (TOTP) — users jadvaliga
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_backup_codes" TEXT[] NOT NULL DEFAULT '{}';
