-- payment_transactions.platform_fee_pct ustuni.
--
-- Bu ustun schema.prisma da (`platformFeePct Decimal? @db.Decimal(5,2)`) e'lon qilingan va
-- teacher dashboard / earnings / kurs-muharrir GET hot-path raw SQL'larida ishlatiladi,
-- lekin MIGRATSIYASI yo'q edi (prod'da qo'lda ALTER bilan qo'shilgan drift). Natijada har
-- qanday yangi muhit (CI, DR-restore, yangi server) `prisma migrate deploy` bilan ko'tarilsa,
-- ustun bo'lmagani uchun bu so'rovlar Postgres 42703 bilan yiqilardi.
--
-- IF NOT EXISTS: prod'da (ustun allaqachon bor) no-op; yangi muhitlarda ustunni qo'shadi.
ALTER TABLE "payment_transactions" ADD COLUMN IF NOT EXISTS "platform_fee_pct" DECIMAL(5,2);
