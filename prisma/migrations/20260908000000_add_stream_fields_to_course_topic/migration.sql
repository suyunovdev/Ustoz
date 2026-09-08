-- Cloudflare Stream himoyalangan dars videolari uchun maydonlar.
-- Ikkalasi ham nullable — mavjud satrlar buzilmaydi (legacy video_provider=NULL).
ALTER TABLE "course_topics" ADD COLUMN "video_provider" TEXT;
ALTER TABLE "course_topics" ADD COLUMN "stream_uid" TEXT;
