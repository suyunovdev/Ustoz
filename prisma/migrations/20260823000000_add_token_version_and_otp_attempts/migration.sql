-- Sessiya invalidatsiyasi: User.tokenVersion (suspend/parol o'zgarishida inkrement)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "token_version" INTEGER NOT NULL DEFAULT 0;

-- OTP brute-force lockout: noto'g'ri urinishlar hisoblagichi
ALTER TABLE "otp_codes" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;
