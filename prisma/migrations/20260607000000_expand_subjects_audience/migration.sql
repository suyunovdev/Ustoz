-- ============================================================
-- Universal platform: SubjectCategory va TargetAudience enumlarini
-- IT-doirasidan barcha ta'lim yo'nalishlari uchun kengaytirish
-- ============================================================

-- ====================== SUBJECT CATEGORY ======================
-- Tillar (mavjud: uzbek, english, russian)
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'arabic_language';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'chinese_language';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'korean_language';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'german_language';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'french_language';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'turkish_language';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'spanish_language';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'japanese_language';

-- San'at va ijodiyot
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'music';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'singing';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'painting';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'drawing';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'photography';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'videography';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'cinema';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'theater';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'dance';

-- Hunarmandchilik va qo'l hunari
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'pottery';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'woodworking';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'sewing';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'knitting';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'embroidery';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'handcraft';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'jewelry';

-- Kasb-hunar va xizmat ko'rsatish
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'cooking';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'confectionery';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'barbering';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'hairstyling';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'makeup';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'manicure';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'tailoring';

-- Sport va salomatlik
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'fitness';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'yoga';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'football';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'basketball';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'martial_arts';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'swimming';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'chess';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'nutrition';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'sports_general';

-- Tibbiyot va psixologiya
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'pharmacy';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'nursing';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'psychology';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'medicine_general';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'first_aid';

-- Huquq
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'law_general';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'civil_law';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'tax_law';

-- Qishloq xo'jaligi
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'agriculture';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'gardening';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'livestock';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'beekeeping';

-- Texnika va muhandislik
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'engineering_general';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'electrical';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'mechanics';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'construction';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'automotive';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'plumbing';

-- Soft skills va shaxsiy rivojlanish
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'leadership';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'public_speaking';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'time_management';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'sales';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'negotiation';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'personal_development';

-- Bolalar va ota-onalar
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'early_development';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'parenting';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'child_psychology';

-- Gumanitar va din
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'philosophy';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'literature';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'sociology';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'religion_islam';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'religion_general';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'quran_studies';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'arabic_studies';

-- Tabiiy fanlar (mavjud: mathematics, physics, chemistry, biology, geometry, algebra)
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'astronomy';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'ecology';

-- Boshqaruv va biznes (mavjud: business_management, entrepreneurship, marketing, finance)
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'accounting';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'logistics';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'project_management';
ALTER TYPE "SubjectCategory" ADD VALUE IF NOT EXISTS 'hr_management';

-- ====================== TARGET AUDIENCE ======================
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'preschoolers';
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'primary_school';
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'middle_school';
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'high_school';
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'university_applicants';
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'professionals';
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'adults';
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'seniors';
ALTER TYPE "TargetAudience" ADD VALUE IF NOT EXISTS 'all_levels';
