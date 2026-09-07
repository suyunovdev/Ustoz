-- Profil bo'limi — prod qo'lda migratsiya (idempotent, additiv).
-- UserProfile: telefon + student qiziqishlari.
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "user_profiles" ADD COLUMN IF NOT EXISTS "interests" TEXT[] NOT NULL DEFAULT '{}';
