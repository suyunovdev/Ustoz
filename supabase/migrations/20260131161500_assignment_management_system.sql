-- Assignment Management System Migration
-- Adds assignments table and storage bucket for file uploads

-- 1. Create assignments table

CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    max_score INTEGER DEFAULT 100,
    file_requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_max_score CHECK (max_score > 0 AND max_score <= 1000)
);

-- 2. Add missing foreign key constraint to assignment_submissions

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assignment_submissions_assignment_id_fkey'
        AND table_name = 'assignment_submissions'
    ) THEN
        ALTER TABLE public.assignment_submissions
        ADD CONSTRAINT assignment_submissions_assignment_id_fkey
        FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create indexes for efficient queries

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date DESC);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);

-- 4. Create storage bucket for assignment submissions

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'assignment-submissions',
    'assignment-submissions',
    false,
    52428800, -- 50MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/zip']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 5. Enable RLS on assignments table

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for assignments

-- Teachers can manage their own assignments
DROP POLICY IF EXISTS "teachers_manage_own_assignments" ON public.assignments;
CREATE POLICY "teachers_manage_own_assignments"
ON public.assignments
FOR ALL
TO authenticated
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

-- Students can view assignments for courses they're enrolled in
DROP POLICY IF EXISTS "students_view_course_assignments" ON public.assignments;
CREATE POLICY "students_view_course_assignments"
ON public.assignments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.enrollments e
        WHERE e.course_id = assignments.course_id
        AND e.student_id = auth.uid()
        AND e.is_active = true
    )
);

-- 7. Update RLS policies for assignment_submissions

-- Students can create their own submissions
DROP POLICY IF EXISTS "students_create_own_submissions" ON public.assignment_submissions;
CREATE POLICY "students_create_own_submissions"
ON public.assignment_submissions
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

-- Students can view their own submissions
DROP POLICY IF EXISTS "students_view_own_submissions" ON public.assignment_submissions;
CREATE POLICY "students_view_own_submissions"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

-- Students can update their own ungraded submissions
DROP POLICY IF EXISTS "students_update_own_ungraded_submissions" ON public.assignment_submissions;
CREATE POLICY "students_update_own_ungraded_submissions"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (student_id = auth.uid() AND grade IS NULL)
WITH CHECK (student_id = auth.uid() AND grade IS NULL);

-- Teachers can view all submissions for their assignments
DROP POLICY IF EXISTS "teachers_view_assignment_submissions" ON public.assignment_submissions;
CREATE POLICY "teachers_view_assignment_submissions"
ON public.assignment_submissions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

-- Teachers can grade submissions for their assignments
DROP POLICY IF EXISTS "teachers_grade_assignment_submissions" ON public.assignment_submissions;
CREATE POLICY "teachers_grade_assignment_submissions"
ON public.assignment_submissions
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
        AND a.teacher_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = assignment_submissions.assignment_id
        AND a.teacher_id = auth.uid()
    )
);

-- 8. Create storage policies for assignment submissions bucket

-- Students can upload their own submission files
DROP POLICY IF EXISTS "students_upload_own_submissions" ON storage.objects;
CREATE POLICY "students_upload_own_submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can view their own submission files
DROP POLICY IF EXISTS "students_view_own_submission_files" ON storage.objects;
CREATE POLICY "students_view_own_submission_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can update their own submission files
DROP POLICY IF EXISTS "students_update_own_submission_files" ON storage.objects;
CREATE POLICY "students_update_own_submission_files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Students can delete their own submission files
DROP POLICY IF EXISTS "students_delete_own_submission_files" ON storage.objects;
CREATE POLICY "students_delete_own_submission_files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'assignment-submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Teachers can view all submission files for their assignments
DROP POLICY IF EXISTS "teachers_view_all_submission_files" ON storage.objects;
CREATE POLICY "teachers_view_all_submission_files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-submissions'
    AND EXISTS (
        SELECT 1 FROM public.assignment_submissions asub
        JOIN public.assignments a ON asub.assignment_id = a.id
        WHERE a.teacher_id = auth.uid()
        AND asub.student_id::text = (storage.foldername(name))[1]
    )
);

-- 9. Create function to update assignment updated_at timestamp

CREATE OR REPLACE FUNCTION public.update_assignment_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 10. Create trigger for assignment timestamp updates

DROP TRIGGER IF EXISTS update_assignment_timestamp_trigger ON public.assignments;
CREATE TRIGGER update_assignment_timestamp_trigger
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_assignment_timestamp();

-- 11. Update notification trigger for assignment grading

CREATE OR REPLACE FUNCTION public.notify_assignment_graded()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_title TEXT;
    course_title TEXT;
BEGIN
    -- Only notify when grade is added (not on initial submission)
    IF NEW.grade IS NOT NULL AND OLD.grade IS NULL THEN
        -- Get assignment and course details
        SELECT a.title, c.title INTO assignment_title, course_title
        FROM public.assignments a
        JOIN public.courses c ON a.course_id = c.id
        WHERE a.id = NEW.assignment_id;
        
        -- Create notification for student
        INSERT INTO public.notifications (
            recipient_id,
            sender_id,
            type,
            title,
            message,
            related_course_id,
            related_entity_id,
            metadata
        ) VALUES (
            NEW.student_id,
            NEW.graded_by,
            'assignment_submission'::public.notification_type,
            'Topshiriq baholandi',
            '"' || assignment_title || '" topshirigi baholandi. Ball: ' || NEW.grade || '/' || (SELECT max_score FROM public.assignments WHERE id = NEW.assignment_id),
            NEW.course_id,
            NEW.id,
            jsonb_build_object(
                'assignment_id', NEW.assignment_id,
                'grade', NEW.grade,
                'graded_at', NEW.graded_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for assignment grading notifications
DROP TRIGGER IF EXISTS notify_assignment_graded_trigger ON public.assignment_submissions;
CREATE TRIGGER notify_assignment_graded_trigger
AFTER UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.notify_assignment_graded();

-- 12. Create mock data for testing

DO $$
DECLARE
    existing_teacher_id UUID;
    existing_student_id UUID;
    existing_course_id UUID;
    assignment_uuid_1 UUID := gen_random_uuid();
    assignment_uuid_2 UUID := gen_random_uuid();
BEGIN
    -- Get existing teacher
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN
        SELECT id INTO existing_teacher_id 
        FROM public.user_profiles 
        WHERE role = 'teacher'::public.user_role 
        LIMIT 1;
        
        SELECT id INTO existing_student_id 
        FROM public.user_profiles 
        WHERE role = 'student'::public.user_role 
        LIMIT 1;
        
        -- Get existing course
        IF existing_teacher_id IS NOT NULL THEN
            SELECT id INTO existing_course_id 
            FROM public.courses 
            WHERE teacher_id = existing_teacher_id 
            LIMIT 1;
            
            IF existing_course_id IS NOT NULL THEN
                -- Create sample assignments
                INSERT INTO public.assignments (id, course_id, teacher_id, title, description, due_date, max_score, file_requirements)
                VALUES 
                    (
                        assignment_uuid_1,
                        existing_course_id,
                        existing_teacher_id,
                        'Birinchi modul bo''yicha loyiha',
                        'Birinchi modulda o''rgangan mavzular asosida kichik loyiha tayyorlang. Loyihada quyidagilar bo''lishi kerak: kod fayllari, README.md, va qisqacha taqdimot.',
                        CURRENT_TIMESTAMP + INTERVAL '7 days',
                        100,
                        'PDF, DOCX, ZIP (max 50MB)'
                    ),
                    (
                        assignment_uuid_2,
                        existing_course_id,
                        existing_teacher_id,
                        'Nazariy savollar',
                        'Kurs bo''yicha 10 ta nazariy savolga yozma javob bering. Har bir javob kamida 100 so''zdan iborat bo''lishi kerak.',
                        CURRENT_TIMESTAMP + INTERVAL '3 days',
                        50,
                        'PDF, DOCX (max 10MB)'
                    )
                ON CONFLICT (id) DO NOTHING;
                
                -- Create sample submission if student exists
                IF existing_student_id IS NOT NULL THEN
                    INSERT INTO public.assignment_submissions (assignment_id, student_id, course_id, submission_text, submitted_at)
                    VALUES (
                        assignment_uuid_1,
                        existing_student_id,
                        existing_course_id,
                        'Men loyihamni GitHub''ga yuklab qo''ydim. Havola: https://github.com/example/project',
                        CURRENT_TIMESTAMP - INTERVAL '1 day'
                    )
                    ON CONFLICT (id) DO NOTHING;
                END IF;
            ELSE
                RAISE NOTICE 'No courses found for teacher';
            END IF;
        ELSE
            RAISE NOTICE 'No teacher found in user_profiles';
        END IF;
    ELSE
        RAISE NOTICE 'Table user_profiles does not exist';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock data insertion failed: %', SQLERRM;
END $$;