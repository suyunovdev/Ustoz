-- Course Categorization System Migration
-- Adds support for target audience, subject categories, and grade levels

-- 0. Ensure prerequisite tables exist

-- Ensure user_role enum exists
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('teacher', 'student', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure user_profiles table exists (prerequisite from previous migration)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ensure course_materials table exists (prerequisite from previous migration)
CREATE TABLE IF NOT EXISTS public.course_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type TEXT,
    file_format TEXT,
    file_url TEXT,
    file_size BIGINT,
    external_link TEXT,
    watermark_enabled BOOLEAN DEFAULT true,
    watermark_text TEXT,
    moderation_status TEXT DEFAULT 'draft',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ
);

-- 1. Create ENUM types for categorization

DO $$ BEGIN
    CREATE TYPE public.target_audience AS ENUM (
        'school_students',      -- Maktab o'quvchilari va abituriyentlar
        'university_students',  -- Oliy ta'lim muassasalari talabalari
        'independent_learners'  -- Mustaqil rivojlanishni istovchilar
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.subject_category AS ENUM (
        'mathematics',
        'physics',
        'chemistry',
        'biology',
        'geometry',
        'algebra',
        'informatics',
        'uzbek_language',
        'english_language',
        'russian_language',
        'history',
        'geography',
        'programming',
        'web_development',
        'mobile_development',
        'data_science',
        'artificial_intelligence',
        'business_management',
        'entrepreneurship',
        'marketing',
        'finance',
        'design',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create courses table (main course metadata)

CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    target_audience public.target_audience NOT NULL,
    subject_category public.subject_category NOT NULL,
    grade_level INTEGER,
    price_usd DECIMAL(10,2) DEFAULT 0,
    price_uzs BIGINT DEFAULT 0,
    cover_image TEXT,
    language TEXT NOT NULL,
    difficulty_level TEXT,
    total_duration INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_grade_level CHECK (grade_level IS NULL OR (grade_level >= 1 AND grade_level <= 11)),
    CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- 3. Create indexes for efficient filtering

CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON public.courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_target_audience ON public.courses(target_audience);
CREATE INDEX IF NOT EXISTS idx_courses_subject_category ON public.courses(subject_category);
CREATE INDEX IF NOT EXISTS idx_courses_grade_level ON public.courses(grade_level);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_language ON public.courses(language);
CREATE INDEX IF NOT EXISTS idx_courses_is_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_rating ON public.courses(rating);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_courses_audience_subject ON public.courses(target_audience, subject_category);
CREATE INDEX IF NOT EXISTS idx_courses_audience_subject_grade ON public.courses(target_audience, subject_category, grade_level);

-- 4. Update course_materials to reference courses table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'course_materials' 
        AND column_name = 'course_uuid'
    ) THEN
        ALTER TABLE public.course_materials 
        ADD COLUMN course_uuid UUID REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_course_materials_course_uuid ON public.course_materials(course_uuid);

-- 5. Create trigger function for updating course timestamps

CREATE OR REPLACE FUNCTION public.update_course_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    IF NEW.is_published = true AND OLD.is_published = false THEN
        NEW.published_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 6. Attach trigger to courses table

DROP TRIGGER IF EXISTS trigger_update_course_timestamp ON public.courses;
CREATE TRIGGER trigger_update_course_timestamp
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_course_timestamp();

-- 7. Enable RLS on courses table

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- 8. Create helper function to check if user is admin

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'::public.user_role
    );
END;
$$;

-- 9. RLS Policies for courses table

-- Teachers can manage their own courses
DROP POLICY IF EXISTS "teachers_manage_own_courses" ON public.courses;
CREATE POLICY "teachers_manage_own_courses"
ON public.courses
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Students can view published courses
DROP POLICY IF EXISTS "students_view_published_courses" ON public.courses;
CREATE POLICY "students_view_published_courses"
ON public.courses
FOR SELECT
TO authenticated
USING (is_published = true);

-- Admins can view all courses
DROP POLICY IF EXISTS "admins_view_all_courses" ON public.courses;
CREATE POLICY "admins_view_all_courses"
ON public.courses
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 10. Create helper function to get subject display name

CREATE OR REPLACE FUNCTION public.get_subject_display_name(subject public.subject_category, grade INTEGER DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF grade IS NOT NULL THEN
        RETURN grade || '-sinf ' || 
            CASE subject
                WHEN 'mathematics' THEN 'Matematika'
                WHEN 'physics' THEN 'Fizika'
                WHEN 'chemistry' THEN 'Kimyo'
                WHEN 'biology' THEN 'Biologiya'
                WHEN 'geometry' THEN 'Geometriya'
                WHEN 'algebra' THEN 'Algebra'
                WHEN 'informatics' THEN 'Informatika'
                WHEN 'uzbek_language' THEN 'O''zbek tili'
                WHEN 'english_language' THEN 'Ingliz tili'
                WHEN 'russian_language' THEN 'Rus tili'
                WHEN 'history' THEN 'Tarix'
                WHEN 'geography' THEN 'Geografiya'
                ELSE subject::TEXT
            END;
    ELSE
        RETURN 
            CASE subject
                WHEN 'programming' THEN 'Dasturlash'
                WHEN 'web_development' THEN 'Web Development'
                WHEN 'mobile_development' THEN 'Mobile Development'
                WHEN 'data_science' THEN 'Data Science'
                WHEN 'artificial_intelligence' THEN 'Sun''iy Intellekt'
                WHEN 'business_management' THEN 'Biznes Boshqaruv'
                WHEN 'entrepreneurship' THEN 'Tadbirkorlik'
                WHEN 'marketing' THEN 'Marketing'
                WHEN 'finance' THEN 'Moliya'
                WHEN 'design' THEN 'Dizayn'
                ELSE subject::TEXT
            END;
    END IF;
END;
$$;

-- 11. Create view for course catalog with display names

CREATE OR REPLACE VIEW public.course_catalog AS
SELECT 
    c.*,
    up.full_name as instructor_name,
    up.avatar_url as instructor_avatar,
    public.get_subject_display_name(c.subject_category, c.grade_level) as subject_display_name,
    CASE c.target_audience
        WHEN 'school_students' THEN 'Maktab o''quvchilari va abituriyentlar'
        WHEN 'university_students' THEN 'Talabalar'
        WHEN 'independent_learners' THEN 'Mustaqil o''rganuvchilar'
    END as audience_display_name
FROM public.courses c
LEFT JOIN public.user_profiles up ON c.teacher_id = up.id
WHERE c.is_published = true;

-- Migration complete: Course categorization system ready
-- Note: Mock data removed to prevent foreign key constraint violations
-- Teachers and courses should be created through the application interface