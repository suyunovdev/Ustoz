-- 19 kurs kategoriyasini seed qilish (idempotent, slug bo'yicha upsert).
-- Prod DB'da categories bo'sh bo'lgani uchun /api/categories [] qaytarardi.
INSERT INTO categories (id, name, slug, description, icon_name, order_index, is_active, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Tabiiy fanlar', 'tabiiy-fanlar', 'Matematika, fizika, kimyo, biologiya, astronomiya', 'BeakerIcon', 1, true, now(), now()),
  (gen_random_uuid(), 'Tillar', 'tillar', 'Ingliz, rus, arab, koreys, xitoy va boshqa tillar', 'LanguageIcon', 2, true, now(), now()),
  (gen_random_uuid(), 'Dasturlash va IT', 'dasturlash', 'Veb, mobil, ma''lumotlar tahlili, sun''iy intellekt', 'CodeBracketIcon', 3, true, now(), now()),
  (gen_random_uuid(), 'Biznes va Boshqaruv', 'biznes', 'Tadbirkorlik, moliya, menejment, buxgalteriya, logistika', 'BriefcaseIcon', 4, true, now(), now()),
  (gen_random_uuid(), 'Marketing va Sotuv', 'marketing', 'Raqamli marketing, SMM, kontent, sotuvlar', 'MegaphoneIcon', 5, true, now(), now()),
  (gen_random_uuid(), 'Dizayn', 'dizayn', 'UI/UX, grafik dizayn, illyustratsiya, brending', 'PaintBrushIcon', 6, true, now(), now()),
  (gen_random_uuid(), 'San''at va Ijodiyot', 'sanat', 'Musiqa, ashula, rasm, raqs, teatr', 'MusicalNoteIcon', 7, true, now(), now()),
  (gen_random_uuid(), 'Foto va Video', 'media', 'Fotografiya, videografiya, montaj, animatsiya', 'VideoCameraIcon', 8, true, now(), now()),
  (gen_random_uuid(), 'Hunarmandchilik', 'hunarmandchilik', 'Kulolchilik, yog''och, tikuvchilik, naqsh, zargarlik', 'SparklesIcon', 9, true, now(), now()),
  (gen_random_uuid(), 'Kasb-hunar', 'kasb-hunar', 'Pazandachilik, qandolatchilik, sartaroshlik, vizaj', 'ScissorsIcon', 10, true, now(), now()),
  (gen_random_uuid(), 'Sport va Salomatlik', 'sport', 'Fitnes, yoga, shaxmat, jang san''atlari, ovqatlanish', 'BoltIcon', 11, true, now(), now()),
  (gen_random_uuid(), 'Tibbiyot va Psixologiya', 'tibbiyot', 'Farmatsevtika, hamshiralik, psixologiya, ilk yordam', 'HeartIcon', 12, true, now(), now()),
  (gen_random_uuid(), 'Huquq', 'huquq', 'Fuqarolik huquqi, soliq huquqi, umumiy huquq', 'ScaleIcon', 13, true, now(), now()),
  (gen_random_uuid(), 'Qishloq xo''jaligi', 'qishloq-xojaligi', 'Dehqonchilik, chorvachilik, asalarichilik, bog''dorchilik', 'SunIcon', 14, true, now(), now()),
  (gen_random_uuid(), 'Texnika va Muhandislik', 'texnika', 'Elektrik, mexanika, qurilish, avto, santexnika', 'WrenchScrewdriverIcon', 15, true, now(), now()),
  (gen_random_uuid(), 'Shaxsiy rivojlanish', 'rivojlanish', 'Yetakchilik, notiqlik, vaqt boshqaruvi, soft skills', 'TrophyIcon', 16, true, now(), now()),
  (gen_random_uuid(), 'Bolalar va Ota-onalar', 'bolalar', 'Erta rivojlanish, ota-onalik, bola psixologiyasi', 'UserGroupIcon', 17, true, now(), now()),
  (gen_random_uuid(), 'Din va Ma''naviyat', 'din-manaviyat', 'Islom asoslari, Qur''on, arab tili (diniy), umumiy ma''naviyat', 'BookOpenIcon', 18, true, now(), now()),
  (gen_random_uuid(), 'Gumanitar fanlar', 'gumanitar', 'Tarix, geografiya, adabiyot, falsafa, sotsiologiya', 'AcademicCapIcon', 19, true, now(), now())
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon_name = EXCLUDED.icon_name,
  order_index = EXCLUDED.order_index,
  is_active = true,
  updated_at = now();
