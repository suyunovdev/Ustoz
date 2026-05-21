-- Content Moderation System Migration
-- Handles course materials, tests, file uploads, and moderation workflow

-- 1. Types
DROP TYPE IF EXISTS public.content_type CASCADE;
CREATE TYPE public.content_type AS ENUM ('document', 'video', 'audio', 'external_link');

DROP TYPE IF EXISTS public.moderation_status CASCADE;
CREATE TYPE public.moderation_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'revision_requested');

DROP TYPE IF EXISTS public.file_format CASCADE;
CREATE TYPE public.file_format AS ENUM ('pdf', 'docx', 'mp4', 'mp3', 'youtube', 'telegram');

DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('teacher', 'student', 'admin');

-- 2. Core Tables

-- User profiles (if not exists)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role public.user_role DEFAULT 'student'::public.user_role,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Course materials table
CREATE TABLE IF NOT EXISTS public.course_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    content_type public.content_type NOT NULL,
    file_format public.file_format,
    file_url TEXT,
    file_size BIGINT,
    external_link TEXT,
    watermark_enabled BOOLEAN DEFAULT true,
    watermark_text TEXT,
    moderation_status public.moderation_status DEFAULT 'draft'::public.moderation_status,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ
);

-- Test questions table
CREATE TABLE IF NOT EXISTS public.test_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Moderation queue table
CREATE TABLE IF NOT EXISTS public.moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    status public.moderation_status DEFAULT 'submitted'::public.moderation_status,
    feedback TEXT,
    plagiarism_score DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    policy_compliant BOOLEAN,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Moderation history table
CREATE TABLE IF NOT EXISTS public.moderation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.course_materials(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    status public.moderation_status NOT NULL,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_course_materials_teacher_id ON public.course_materials(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_materials_status ON public.course_materials(moderation_status);
CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON public.course_materials(course_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_material_id ON public.test_questions(material_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_reviewer_id ON public.moderation_queue(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_moderation_history_material_id ON public.moderation_history(material_id);

-- 4. Functions

-- Trigger function for user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, role, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student'::public.user_role),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Function to update material status
CREATE OR REPLACE FUNCTION public.update_material_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    IF NEW.moderation_status = 'submitted' AND OLD.moderation_status != 'submitted' THEN
        NEW.submitted_at := CURRENT_TIMESTAMP;
    END IF;
    
    IF NEW.moderation_status IN ('approved', 'rejected') AND OLD.moderation_status != NEW.moderation_status THEN
        NEW.reviewed_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'::public.user_role
    )
$$;

-- Function to check if user is teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'teacher'::public.user_role
    )
$$;

-- 5. Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_history ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies

-- User profiles policies
DROP POLICY IF EXISTS "users_manage_own_user_profiles" ON public.user_profiles;
CREATE POLICY "users_manage_own_user_profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "public_read_user_profiles" ON public.user_profiles;
CREATE POLICY "public_read_user_profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);

-- Course materials policies
DROP POLICY IF EXISTS "teachers_manage_own_materials" ON public.course_materials;
CREATE POLICY "teachers_manage_own_materials"
ON public.course_materials
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

DROP POLICY IF EXISTS "admins_view_all_materials" ON public.course_materials;
CREATE POLICY "admins_view_all_materials"
ON public.course_materials
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "students_view_approved_materials" ON public.course_materials;
CREATE POLICY "students_view_approved_materials"
ON public.course_materials
FOR SELECT
TO authenticated
USING (moderation_status = 'approved'::public.moderation_status);

-- Test questions policies
DROP POLICY IF EXISTS "teachers_manage_own_questions" ON public.test_questions;
CREATE POLICY "teachers_manage_own_questions"
ON public.test_questions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.course_materials
        WHERE id = test_questions.material_id
        AND teacher_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.course_materials
        WHERE id = test_questions.material_id
        AND teacher_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "admins_view_all_questions" ON public.test_questions;
CREATE POLICY "admins_view_all_questions"
ON public.test_questions
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Moderation queue policies
DROP POLICY IF EXISTS "admins_manage_moderation_queue" ON public.moderation_queue;
CREATE POLICY "admins_manage_moderation_queue"
ON public.moderation_queue
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "teachers_view_own_submissions" ON public.moderation_queue;
CREATE POLICY "teachers_view_own_submissions"
ON public.moderation_queue
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.course_materials
        WHERE id = moderation_queue.material_id
        AND teacher_id = auth.uid()
    )
);

-- Moderation history policies
DROP POLICY IF EXISTS "admins_view_all_history" ON public.moderation_history;
CREATE POLICY "admins_view_all_history"
ON public.moderation_history
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "teachers_view_own_history" ON public.moderation_history;
CREATE POLICY "teachers_view_own_history"
ON public.moderation_history
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.course_materials
        WHERE id = moderation_history.material_id
        AND teacher_id = auth.uid()
    )
);

-- 7. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_material_status_change ON public.course_materials;
CREATE TRIGGER on_material_status_change
    BEFORE UPDATE ON public.course_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.update_material_status();

-- 8. Mock Data
DO $$
DECLARE
    teacher_uuid UUID := gen_random_uuid();
    admin_uuid UUID := gen_random_uuid();
    student_uuid UUID := gen_random_uuid();
    material1_uuid UUID := gen_random_uuid();
    material2_uuid UUID := gen_random_uuid();
    material3_uuid UUID := gen_random_uuid();
BEGIN
    -- Create auth users
    INSERT INTO auth.users (
        id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_user_meta_data, raw_app_meta_data,
        is_sso_user, is_anonymous, confirmation_token, confirmation_sent_at,
        recovery_token, recovery_sent_at, email_change_token_new, email_change,
        email_change_sent_at, email_change_token_current, email_change_confirm_status,
        reauthentication_token, reauthentication_sent_at, phone, phone_change,
        phone_change_token, phone_change_sent_at
    ) VALUES
        (teacher_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'teacher@ustoz.uz', crypt('teacher123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Alisher Karimov', 'role', 'teacher'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (admin_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'admin@ustoz.uz', crypt('admin123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Nodira Rahimova', 'role', 'admin'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null),
        (student_uuid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
         'student@ustoz.uz', crypt('student123', gen_salt('bf', 10)), now(), now(), now(),
         jsonb_build_object('full_name', 'Dilshod Tursunov', 'role', 'student'),
         jsonb_build_object('provider', 'email', 'providers', ARRAY['email']::TEXT[]),
         false, false, '', null, '', null, '', '', null, '', 0, '', null, null, '', '', null)
    ON CONFLICT (id) DO NOTHING;

    -- Create course materials
    INSERT INTO public.course_materials (
        id, teacher_id, course_id, title, description, content_type, file_format,
        file_url, watermark_enabled, watermark_text, moderation_status, order_index, submitted_at
    ) VALUES
        (material1_uuid, teacher_uuid, 'course-1', 'JavaScript Asoslari - 1-dars',
         'JavaScript dasturlash tilining asosiy tushunchalari', 'document'::public.content_type, 'pdf'::public.file_format,
         'https://example.com/materials/js-basics-lesson1.pdf', true, 'Ustoz Platform - Alisher Karimov',
         'submitted'::public.moderation_status, 1, now() - interval '2 hours'),
        (material2_uuid, teacher_uuid, 'course-1', 'JavaScript Amaliyot - Video Dars',
         'Amaliy mashqlar va kod yozish', 'video'::public.content_type, 'youtube'::public.file_format,
         null, true, 'Ustoz Platform', 'under_review'::public.moderation_status, 2, now() - interval '1 hour'),
        (material3_uuid, teacher_uuid, 'course-2', 'React.js Kirish',
         'React kutubxonasi bilan tanishish', 'document'::public.content_type, 'pdf'::public.file_format,
         'https://example.com/materials/react-intro.pdf', true, 'Ustoz Platform',
         'approved'::public.moderation_status, 1, now() - interval '3 days')
    ON CONFLICT (id) DO NOTHING;

    -- Update external link for YouTube material
    UPDATE public.course_materials
    SET external_link = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    WHERE id = material2_uuid;

    -- Create test questions
    INSERT INTO public.test_questions (
        material_id, question_text, option_a, option_b, option_c, option_d,
        correct_answer, explanation, order_index
    ) VALUES
        (material1_uuid, 'JavaScript qaysi tilda yozilgan?',
         'C++', 'Java', 'Python', 'JavaScript o''zini-o''zi yaratgan',
         'A', 'JavaScript C++ tilida yozilgan V8 engine asosida ishlaydi', 1),
        (material1_uuid, 'let va const o''rtasidagi farq nima?',
         'Farq yo''q', 'const o''zgarmas', 'let o''zgarmas', 'Ikkalasi ham o''zgarmas',
         'B', 'const bilan e''lon qilingan o''zgaruvchi qayta tayinlanmaydi', 2),
        (material1_uuid, 'JavaScript qayerda ishlatiladi?',
         'Faqat brauzerda', 'Faqat serverda', 'Brauzer va serverda', 'Hech qayerda',
         'C', 'JavaScript brauzerda ham, Node.js orqali serverda ham ishlatiladi', 3),
        (material3_uuid, 'React nima?',
         'Dasturlash tili', 'JavaScript kutubxonasi', 'Ma''lumotlar bazasi', 'Operatsion tizim',
         'B', 'React - bu foydalanuvchi interfeyslari yaratish uchun JavaScript kutubxonasi', 1),
        (material3_uuid, 'JSX nima?',
         'JavaScript kengaytmasi', 'CSS framework', 'Ma''lumotlar bazasi', 'Server',
         'A', 'JSX - JavaScript ichida HTML yozish imkonini beruvchi sintaksis kengaytmasi', 2)
    ON CONFLICT (id) DO NOTHING;

    -- Create moderation queue entries
    INSERT INTO public.moderation_queue (
        material_id, reviewer_id, status, plagiarism_score, quality_score,
        policy_compliant, submitted_at
    ) VALUES
        (material1_uuid, admin_uuid, 'submitted'::public.moderation_status, 5.2, 85.5, true, now() - interval '2 hours'),
        (material2_uuid, admin_uuid, 'under_review'::public.moderation_status, 3.1, 92.0, true, now() - interval '1 hour')
    ON CONFLICT (id) DO NOTHING;

    -- Create moderation history
    INSERT INTO public.moderation_history (
        material_id, reviewer_id, action, status, feedback
    ) VALUES
        (material3_uuid, admin_uuid, 'Approved', 'approved'::public.moderation_status,
         'Ajoyib material! Tarkib sifatli va talabaga mos.'),
        (material1_uuid, admin_uuid, 'Submitted for review', 'submitted'::public.moderation_status,
         'Material ko''rib chiqish uchun yuborildi')
    ON CONFLICT (id) DO NOTHING;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;