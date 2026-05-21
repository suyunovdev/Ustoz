-- Add 'law' subject to subject_category enum
-- This enables 'Huquq' as a valid subject option for school students

-- Add 'law' to the subject_category enum if it doesn't exist
DO $$
BEGIN
    -- Check if 'law' value already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'law' 
        AND enumtypid = 'public.subject_category'::regtype
    ) THEN
        -- Add 'law' after 'geography' in the enum
        ALTER TYPE public.subject_category ADD VALUE 'law' AFTER 'geography';
    END IF;
END $$;

-- Update the get_subject_display_name function to include 'law'
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
                WHEN 'law' THEN 'Huquq'
                ELSE subject::TEXT
            END;
    ELSE
        RETURN 
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
                WHEN 'law' THEN 'Huquq'
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
                WHEN 'other' THEN 'Boshqa'
                ELSE subject::TEXT
            END;
    END IF;
END;
$$;