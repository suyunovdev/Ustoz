-- Rollback Hierarchical Category System
-- Restores simple subject_category ENUM approach

-- 1. Remove hierarchical category columns from courses table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN category_id;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'subcategory_id'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN subcategory_id;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'subject_id'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN subject_id;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE public.courses DROP COLUMN tags;
    END IF;
END $$;

-- 2. Drop hierarchical category tables
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.subcategories CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;

-- 3. Ensure subject_category column exists and is properly configured
DO $$
BEGIN
    -- Ensure subject_category ENUM type exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subject_category') THEN
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
            'law',
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
    END IF;
    
    -- Add subject_category column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'subject_category'
    ) THEN
        ALTER TABLE public.courses 
        ADD COLUMN subject_category public.subject_category;
    END IF;
END $$;

-- 4. Create index for subject_category
CREATE INDEX IF NOT EXISTS idx_courses_subject_category ON public.courses(subject_category);

-- Note: This migration restores the simple, working category system
-- that was in place before the hierarchical category implementation.