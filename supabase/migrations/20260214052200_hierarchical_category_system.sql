-- Hierarchical Category System Migration
-- Creates 3-tier category structure: Main Categories → Subcategories → Subjects
-- Adds tags support for courses

-- 1. Create categories table (Main categories: Maktab fanlari, Oliy ta'lim, Mustaqil o'rganuvchilar)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_uz TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories(order_index);

-- 2. Create subcategories table (e.g., Boshlang'ich ta'lim, Asosiy o'rta ta'lim, etc.)
CREATE TABLE IF NOT EXISTS public.subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_uz TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_order ON public.subcategories(category_id, order_index);

-- 3. Create subjects table (Specific subjects under each subcategory)
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcategory_id UUID NOT NULL REFERENCES public.subcategories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_uz TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subcategory_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_subcategory_id ON public.subjects(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_subjects_order ON public.subjects(subcategory_id, order_index);

-- 4. Add new columns to courses table for hierarchical categories and tags
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.courses 
        ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'subcategory_id'
    ) THEN
        ALTER TABLE public.courses 
        ADD COLUMN subcategory_id UUID REFERENCES public.subcategories(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'subject_id'
    ) THEN
        ALTER TABLE public.courses 
        ADD COLUMN subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.courses 
        ADD COLUMN tags TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_category_id ON public.courses(category_id);
CREATE INDEX IF NOT EXISTS idx_courses_subcategory_id ON public.courses(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_courses_subject_id ON public.courses(subject_id);
CREATE INDEX IF NOT EXISTS idx_courses_tags ON public.courses USING GIN(tags);

-- 5. Enable RLS on new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Public read access for category data
DROP POLICY IF EXISTS "public_read_categories" ON public.categories;
CREATE POLICY "public_read_categories"
ON public.categories
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "public_read_subcategories" ON public.subcategories;
CREATE POLICY "public_read_subcategories"
ON public.subcategories
FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "public_read_subjects" ON public.subjects;
CREATE POLICY "public_read_subjects"
ON public.subjects
FOR SELECT
TO public
USING (true);

-- 7. Populate categories, subcategories, and subjects with complete structure
DO $$
DECLARE
    -- Main Categories
    cat_maktab UUID;
    cat_oliy UUID;
    cat_mustaqil UUID;
    
    -- Maktab fanlari subcategories
    subcat_boshlangich UUID;
    subcat_asosiy UUID;
    subcat_yuqori UUID;
    
    -- Oliy ta'lim subcategories
    subcat_talim_pedagogika UUID;
    subcat_tabiiy_aniq UUID;
    subcat_texnika UUID;
    subcat_iqtisodiyot UUID;
    subcat_huquq_ijtimoiy UUID;
    subcat_tibbiyot UUID;
    subcat_sanat UUID;
    
    -- Mustaqil o'rganuvchilar subcategories
    subcat_xorijiy_tillar UUID;
    subcat_it_dasturlash UUID;
    subcat_biznes_marketing UUID;
    subcat_shaxsiy_rivojlanish UUID;
    subcat_kasbiy_konikmalar UUID;
    subcat_boshqa_yonalishlar UUID;
BEGIN
    -- Insert Main Categories
    INSERT INTO public.categories (id, name, name_uz, description, order_index)
    VALUES 
        (gen_random_uuid(), 'school_subjects', 'Maktab fanlari', 'Umumiy o''rta ta''lim – 1-11 sinflar', 1),
        (gen_random_uuid(), 'higher_education', 'Oliy ta''lim yo''nalishlari va fanlari', 'Universitet va oliy ta''lim muassasalari uchun', 2),
        (gen_random_uuid(), 'independent_learning', 'Mustaqil o''rganuvchilar va professional rivojlanish uchun kurslar', 'Kasbiy va shaxsiy rivojlanish', 3)
    ON CONFLICT (name) DO NOTHING
    RETURNING id INTO cat_maktab;
    
    -- Get category IDs
    SELECT id INTO cat_maktab FROM public.categories WHERE name = 'school_subjects' LIMIT 1;
    SELECT id INTO cat_oliy FROM public.categories WHERE name = 'higher_education' LIMIT 1;
    SELECT id INTO cat_mustaqil FROM public.categories WHERE name = 'independent_learning' LIMIT 1;
    
    -- ========== MAKTAB FANLARI SUBCATEGORIES ==========
    
    -- 1.1 Boshlang'ich ta'lim (1-4 sinflar)
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_maktab, 'primary_education', 'Boshlang''ich ta''lim (1–4-sinflar)', '1-4 sinf o''quvchilari uchun', 1)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_boshlangich;
    SELECT id INTO subcat_boshlangich FROM public.subcategories WHERE category_id = cat_maktab AND name = 'primary_education' LIMIT 1;
    
    -- Boshlang'ich ta'lim subjects
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_boshlangich, 'mathematics', 'Matematika', 1),
        (subcat_boshlangich, 'reading_writing', 'O''qish va yozuv savodxonligi', 2),
        (subcat_boshlangich, 'native_language', 'Ona tili va o''qish', 3),
        (subcat_boshlangich, 'russian_language', 'Rus tili', 4),
        (subcat_boshlangich, 'english_primary', 'Ingliz tili (boshlang''ich)', 5),
        (subcat_boshlangich, 'natural_science', 'Tabiatshunoslik', 6),
        (subcat_boshlangich, 'art_music', 'Tasviriy san''at va musiqa', 7),
        (subcat_boshlangich, 'physical_education', 'Jismoniy tarbiya va sog''iq', 8)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 1.2 Asosiy o'rta ta'lim (5-9 sinflar)
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_maktab, 'basic_secondary', 'Asosiy o''rta ta''lim (5–9-sinflar)', '5-9 sinf o''quvchilari uchun', 2)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_asosiy;
    SELECT id INTO subcat_asosiy FROM public.subcategories WHERE category_id = cat_maktab AND name = 'basic_secondary' LIMIT 1;
    
    -- Asosiy o'rta ta'lim subjects
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_asosiy, 'mathematics_algebra_geometry', 'Matematika (Algebra va Geometriya)', 1),
        (subcat_asosiy, 'uzbek_language_literature', 'O''zbek tili va adabiyoti', 2),
        (subcat_asosiy, 'russian_language_literature', 'Rus tili va adabiyoti', 3),
        (subcat_asosiy, 'english_language', 'Ingliz tili', 4),
        (subcat_asosiy, 'physics', 'Fizika', 5),
        (subcat_asosiy, 'chemistry', 'Kimyo', 6),
        (subcat_asosiy, 'biology', 'Biologiya', 7),
        (subcat_asosiy, 'geography', 'Geografiya', 8),
        (subcat_asosiy, 'history_world', 'Tarix (O''zbekiston va Jahon tarixi)', 9),
        (subcat_asosiy, 'uzbekistan_history', 'O''zbekiston tarixi', 10),
        (subcat_asosiy, 'informatics_it', 'Informatika va axborot texnologiyalari', 11),
        (subcat_asosiy, 'law_basics', 'Huquq asoslari (Yurisprudensiyaga tayyorgarlik uchun)', 12),
        (subcat_asosiy, 'physical_education_secondary', 'Jismoniy tarbiya', 13),
        (subcat_asosiy, 'art_music_drawing', 'Tasviriy san''at / Musiqa / Chizish', 14)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 1.3 Yuqori sinflar (10-11 sinflar va DTM tayyorgarlik)
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_maktab, 'upper_grades', 'Yuqori sinflar (10–11-sinflar va DTM tayyorgarlik)', '10-11 sinf va DTM tayyorgarlik', 3)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_yuqori;
    SELECT id INTO subcat_yuqori FROM public.subcategories WHERE category_id = cat_maktab AND name = 'upper_grades' LIMIT 1;
    
    -- Yuqori sinflar subjects
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_yuqori, 'mathematics_advanced', 'Matematika (chuqurlashtirilgan / DTM)', 1),
        (subcat_yuqori, 'physics_advanced', 'Fizika (chuqurlashtirilgan / DTM)', 2),
        (subcat_yuqori, 'chemistry_advanced', 'Kimyo (chuqurlashtirilgan / DTM)', 3),
        (subcat_yuqori, 'biology_advanced', 'Biologiya (chuqurlashtirilgan / DTM)', 4),
        (subcat_yuqori, 'geography_advanced', 'Geografiya (chuqurlashtirilgan / DTM)', 5),
        (subcat_yuqori, 'uzbek_language_advanced', 'O''zbek tili va adabiyoti (chuqurlashtirilgan / DTM)', 6),
        (subcat_yuqori, 'history_advanced', 'Tarix (chuqurlashtirilgan / DTM)', 7),
        (subcat_yuqori, 'english_advanced', 'Ingliz tili (chuqurlashtirilgan / IELTS / DTM)', 8),
        (subcat_yuqori, 'russian_advanced', 'Rus tili (chuqurlashtirilgan)', 9),
        (subcat_yuqori, 'law_jurisprudence', 'Huquq / Yurisprudensiya (DTM uchun Huquq fanidan tayyorgarlik)', 10),
        (subcat_yuqori, 'other_subjects', 'Boshqa fanlar', 11)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- ========== OLIY TA'LIM SUBCATEGORIES ==========
    
    -- 2.1 Ta'lim va pedagogika
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_oliy, 'education_pedagogy', 'Ta''lim va pedagogika', 'Pedagogika yo''nalishlari', 1)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_talim_pedagogika;
    SELECT id INTO subcat_talim_pedagogika FROM public.subcategories WHERE category_id = cat_oliy AND name = 'education_pedagogy' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_talim_pedagogika, 'primary_education_pedagogy', 'Boshlang''ich ta''lim', 1),
        (subcat_talim_pedagogika, 'preschool_education', 'Maktabgacha ta''lim', 2),
        (subcat_talim_pedagogika, 'uzbek_language_literature_teaching', 'O''zbek tili va adabiyoti', 3),
        (subcat_talim_pedagogika, 'foreign_languages_teaching', 'Xorijiy tillar o''qitish', 4),
        (subcat_talim_pedagogika, 'physical_education_sports', 'Jismoniy tarbiya va sport pedagogikasi', 5)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 2.2 Tabiiy va aniq fanlar
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_oliy, 'natural_exact_sciences', 'Tabiiy va aniq fanlar', 'Fan va tadqiqot yo''nalishlari', 2)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_tabiiy_aniq;
    SELECT id INTO subcat_tabiiy_aniq FROM public.subcategories WHERE category_id = cat_oliy AND name = 'natural_exact_sciences' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_tabiiy_aniq, 'mathematics_statistics', 'Matematika va statistika', 1),
        (subcat_tabiiy_aniq, 'physics_university', 'Fizika', 2),
        (subcat_tabiiy_aniq, 'chemistry_university', 'Kimyo', 3),
        (subcat_tabiiy_aniq, 'biology_biotechnology', 'Biologiya va biotexnologiya', 4),
        (subcat_tabiiy_aniq, 'geography_geology', 'Geografiya va geologiya', 5)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 2.3 Texnika va muhandislik yo'nalishlari
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_oliy, 'engineering_technology', 'Texnika va muhandislik yo''nalishlari', 'Muhandislik va texnologiya', 3)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_texnika;
    SELECT id INTO subcat_texnika FROM public.subcategories WHERE category_id = cat_oliy AND name = 'engineering_technology' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_texnika, 'computer_engineering', 'Kompyuter injiniringi va dasturiy ta''minot', 1),
        (subcat_texnika, 'information_technology', 'Axborot texnologiyalari', 2),
        (subcat_texnika, 'construction_architecture', 'Qurilish va arxitektura', 3),
        (subcat_texnika, 'mechanical_automotive', 'Mashinasozlik va avtomobilsozlik', 4),
        (subcat_texnika, 'energy_electrical', 'Energetika va elektrotexnika', 5),
        (subcat_texnika, 'chemical_engineering', 'Kimyo texnologiyasi va muhandisligi', 6)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 2.4 Iqtisodiyot, moliya va biznes
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_oliy, 'economics_finance', 'Iqtisodiyot, moliya va biznes', 'Biznes va iqtisodiyot', 4)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_iqtisodiyot;
    SELECT id INTO subcat_iqtisodiyot FROM public.subcategories WHERE category_id = cat_oliy AND name = 'economics_finance' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_iqtisodiyot, 'economics', 'Iqtisodiyot', 1),
        (subcat_iqtisodiyot, 'finance_management', 'Moliya va moliyaviy menejment', 2),
        (subcat_iqtisodiyot, 'accounting_audit', 'Buxgalteriya va audit', 3),
        (subcat_iqtisodiyot, 'business_management', 'Biznes boshqaruvi va menejment', 4)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 2.5 Huquq va ijtimoiy fanlar
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_oliy, 'law_social_sciences', 'Huquq va ijtimoiy fanlar', 'Huquq va jamiyat fanlari', 5)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_huquq_ijtimoiy;
    SELECT id INTO subcat_huquq_ijtimoiy FROM public.subcategories WHERE category_id = cat_oliy AND name = 'law_social_sciences' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_huquq_ijtimoiy, 'jurisprudence', 'Huquqshunoslik (Yurisprudensiya)', 1),
        (subcat_huquq_ijtimoiy, 'international_law', 'Xalqaro huquq', 2),
        (subcat_huquq_ijtimoiy, 'criminal_law', 'Jinoyat huquqi', 3),
        (subcat_huquq_ijtimoiy, 'civil_law', 'Fuqarolik huquqi', 4),
        (subcat_huquq_ijtimoiy, 'constitutional_law', 'Konstitutsiyaviy huquq', 5),
        (subcat_huquq_ijtimoiy, 'political_science', 'Siyosatshunoslik', 6),
        (subcat_huquq_ijtimoiy, 'sociology_social_work', 'Sotsiologiya va ijtimoiy ish', 7)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 2.6 Tibbiyot va sog'liqni saqlash
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_oliy, 'medicine_healthcare', 'Tibbiyot va sog''liqni saqlash', 'Tibbiyot yo''nalishlari', 6)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_tibbiyot;
    SELECT id INTO subcat_tibbiyot FROM public.subcategories WHERE category_id = cat_oliy AND name = 'medicine_healthcare' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_tibbiyot, 'general_medicine', 'Umumiy tibbiyot', 1),
        (subcat_tibbiyot, 'dentistry', 'Stomatologiya', 2),
        (subcat_tibbiyot, 'pharmacy', 'Farmatsiya', 3),
        (subcat_tibbiyot, 'medical_biology', 'Tibbiy biologiya', 4),
        (subcat_tibbiyot, 'nursing', 'Hamshiralik ishi', 5)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 2.7 San'at, madaniyat va dizayn
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_oliy, 'art_culture_design', 'San''at, madaniyat va dizayn', 'San''at va ijodiy yo''nalishlar', 7)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_sanat;
    SELECT id INTO subcat_sanat FROM public.subcategories WHERE category_id = cat_oliy AND name = 'art_culture_design' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_sanat, 'visual_arts_graphic_design', 'Tasviriy san''at va grafik dizayn', 1),
        (subcat_sanat, 'music_performing_arts', 'Musiqa va sahna san''ati', 2),
        (subcat_sanat, 'cultural_studies_tourism', 'Madaniyatshunoslik va turizm', 3)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- ========== MUSTAQIL O'RGANUVCHILAR SUBCATEGORIES ==========
    
    -- 3.1 Xorijiy tillar
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_mustaqil, 'foreign_languages', 'Xorijiy tillar', 'Til o''rganish kurslari', 1)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_xorijiy_tillar;
    SELECT id INTO subcat_xorijiy_tillar FROM public.subcategories WHERE category_id = cat_mustaqil AND name = 'foreign_languages' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_xorijiy_tillar, 'english_comprehensive', 'Ingliz tili (boshlang''ich → Advanced, IELTS, TOEFL)', 1),
        (subcat_xorijiy_tillar, 'russian_language_independent', 'Rus tili', 2),
        (subcat_xorijiy_tillar, 'korean_language', 'Koreys tili', 3),
        (subcat_xorijiy_tillar, 'german_language', 'Nemis tili', 4),
        (subcat_xorijiy_tillar, 'french_language', 'Fransuz tili', 5),
        (subcat_xorijiy_tillar, 'arabic_language', 'Arab tili', 6),
        (subcat_xorijiy_tillar, 'chinese_language', 'Xitoy tili', 7)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 3.2 IT va dasturlash
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_mustaqil, 'it_programming', 'IT va dasturlash', 'Dasturlash va texnologiya', 2)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_it_dasturlash;
    SELECT id INTO subcat_it_dasturlash FROM public.subcategories WHERE category_id = cat_mustaqil AND name = 'it_programming' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_it_dasturlash, 'python_programming', 'Python dasturlash', 1),
        (subcat_it_dasturlash, 'javascript_web', 'JavaScript va veb-dasturlash', 2),
        (subcat_it_dasturlash, 'frontend_development', 'Frontend (React, Vue, Angular)', 3),
        (subcat_it_dasturlash, 'backend_development', 'Backend (Node.js, Django, Laravel)', 4),
        (subcat_it_dasturlash, 'mobile_apps', 'Mobil ilovalar (Flutter, React Native)', 5),
        (subcat_it_dasturlash, 'data_science_ml', 'Data Science va Machine Learning', 6),
        (subcat_it_dasturlash, 'artificial_intelligence_basics', 'Sun''iy intellekt asoslari', 7),
        (subcat_it_dasturlash, 'cybersecurity', 'Kibertahdidlar va cybersecurity', 8)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 3.3 Biznes va marketing
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_mustaqil, 'business_marketing', 'Biznes va marketing', 'Biznes rivojlantirish', 3)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_biznes_marketing;
    SELECT id INTO subcat_biznes_marketing FROM public.subcategories WHERE category_id = cat_mustaqil AND name = 'business_marketing' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_biznes_marketing, 'business_startups', 'Biznes boshlash va startaplar', 1),
        (subcat_biznes_marketing, 'digital_marketing_smm', 'Digital marketing va SMM', 2),
        (subcat_biznes_marketing, 'advertising_content', 'Reklama va kontent marketing', 3),
        (subcat_biznes_marketing, 'seo_google_ads', 'SEO va Google Ads', 4),
        (subcat_biznes_marketing, 'financial_literacy', 'Moliyaviy savodxonlik va investitsiya', 5)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 3.4 Shaxsiy rivojlanish va soft skills
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_mustaqil, 'personal_development', 'Shaxsiy rivojlanish va soft skills', 'Shaxsiy o''sish', 4)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_shaxsiy_rivojlanish;
    SELECT id INTO subcat_shaxsiy_rivojlanish FROM public.subcategories WHERE category_id = cat_mustaqil AND name = 'personal_development' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_shaxsiy_rivojlanish, 'time_management', 'Vaqtni boshqarish va produktivlik', 1),
        (subcat_shaxsiy_rivojlanish, 'public_speaking', 'Public speaking va prezentatsiya', 2),
        (subcat_shaxsiy_rivojlanish, 'communication_negotiation', 'Kommunikatsiya va muzokaralar', 3),
        (subcat_shaxsiy_rivojlanish, 'motivation_goals', 'Motivatsiya va maqsad qo''yish', 4),
        (subcat_shaxsiy_rivojlanish, 'stress_management', 'Stressni boshqarish va emotsional intellekt', 5)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 3.5 Kasbiy ko'nikmalar
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_mustaqil, 'professional_skills', 'Kasbiy ko''nikmalar', 'Kasbiy tayyorgarlik', 5)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_kasbiy_konikmalar;
    SELECT id INTO subcat_kasbiy_konikmalar FROM public.subcategories WHERE category_id = cat_mustaqil AND name = 'professional_skills' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_kasbiy_konikmalar, 'graphic_design', 'Grafik dizayn (Figma, Photoshop, Illustrator)', 1),
        (subcat_kasbiy_konikmalar, 'video_editing', 'Video montaj (Premiere Pro, DaVinci Resolve)', 2),
        (subcat_kasbiy_konikmalar, 'content_creation', 'Kontent yaratish va YouTube', 3),
        (subcat_kasbiy_konikmalar, 'project_management', 'Loyiha boshqaruvi', 4),
        (subcat_kasbiy_konikmalar, 'hr_recruiting', 'HR va rekruting', 5)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    -- 3.6 Boshqa ommabop yo'nalishlar
    INSERT INTO public.subcategories (id, category_id, name, name_uz, description, order_index)
    VALUES (gen_random_uuid(), cat_mustaqil, 'other_popular', 'Boshqa ommabop yo''nalishlar', 'Turli xil yo''nalishlar', 6)
    ON CONFLICT (category_id, name) DO NOTHING
    RETURNING id INTO subcat_boshqa_yonalishlar;
    SELECT id INTO subcat_boshqa_yonalishlar FROM public.subcategories WHERE category_id = cat_mustaqil AND name = 'other_popular' LIMIT 1;
    
    INSERT INTO public.subjects (subcategory_id, name, name_uz, order_index)
    VALUES 
        (subcat_boshqa_yonalishlar, 'fitness_nutrition', 'Fitnes va sog''lom ovqatlanish', 1),
        (subcat_boshqa_yonalishlar, 'cooking', 'Oshxona va taom tayyorlash', 2),
        (subcat_boshqa_yonalishlar, 'photography_videography', 'Foto va video suratga olish', 3),
        (subcat_boshqa_yonalishlar, 'psychology_basics', 'Psixologiya asoslari', 4),
        (subcat_boshqa_yonalishlar, 'uzbekistan_history_culture', 'O''zbekiston tarixi va madaniyati', 5)
    ON CONFLICT (subcategory_id, name) DO NOTHING;
    
    RAISE NOTICE 'Hierarchical category system populated successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Category population failed: %', SQLERRM;
END $$;

-- 8. Create helper function to get full category path
CREATE OR REPLACE FUNCTION public.get_category_path(p_subject_id UUID)
RETURNS TABLE(
    category_name TEXT,
    category_name_uz TEXT,
    subcategory_name TEXT,
    subcategory_name_uz TEXT,
    subject_name TEXT,
    subject_name_uz TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.name,
        c.name_uz,
        sc.name,
        sc.name_uz,
        s.name,
        s.name_uz
    FROM public.subjects s
    JOIN public.subcategories sc ON s.subcategory_id = sc.id
    JOIN public.categories c ON sc.category_id = c.id
    WHERE s.id = p_subject_id;
END;
$$;

-- Migration complete: Hierarchical category system with 3 tiers ready