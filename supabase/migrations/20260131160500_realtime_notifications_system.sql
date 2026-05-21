-- Real-time Notifications System Migration
-- Adds support for instant notifications when students enroll, complete quizzes, or submit assignments

-- 1. Create notification types enum

DO $$ BEGIN
    CREATE TYPE public.notification_type AS ENUM (
        'enrollment',
        'quiz_completion',
        'assignment_submission',
        'course_update',
        'achievement'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.notification_status AS ENUM (
        'unread',
        'read',
        'archived'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create enrollments table

CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT unique_student_course UNIQUE(student_id, course_id),
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- 3. Create quiz completions table

CREATE TABLE IF NOT EXISTS public.quiz_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    percentage DECIMAL(5,2),
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    time_taken INTEGER,
    
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= max_score),
    CONSTRAINT valid_percentage CHECK (percentage >= 0 AND percentage <= 100)
);

-- 4. Create assignment submissions table

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    assignment_id UUID NOT NULL,
    submission_url TEXT,
    submission_text TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    grade INTEGER,
    feedback TEXT,
    graded_at TIMESTAMPTZ,
    graded_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
    CONSTRAINT valid_grade CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100))
);

-- 5. Create notifications table

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    type public.notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status public.notification_status DEFAULT 'unread'::public.notification_status,
    related_course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    related_entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

-- 6. Create indexes for efficient queries

CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON public.enrollments(enrolled_at DESC);

CREATE INDEX IF NOT EXISTS idx_quiz_completions_student_id ON public.quiz_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_course_id ON public.quiz_completions(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_completions_completed_at ON public.quiz_completions(completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_course_id ON public.assignment_submissions(course_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_submitted_at ON public.assignment_submissions(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON public.notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- 7. Create trigger functions for automatic notification creation

-- Function to create notification for new enrollment
CREATE OR REPLACE FUNCTION public.notify_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    course_title TEXT;
    teacher_id UUID;
    student_name TEXT;
BEGIN
    -- Get course details
    SELECT title, teacher_id INTO course_title, teacher_id
    FROM public.courses
    WHERE id = NEW.course_id;
    
    -- Get student name
    SELECT full_name INTO student_name
    FROM public.user_profiles
    WHERE id = NEW.student_id;
    
    -- Create notification for teacher
    IF teacher_id IS NOT NULL THEN
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
            teacher_id,
            NEW.student_id,
            'enrollment'::public.notification_type,
            'Yangi talaba kursga yozildi',
            student_name || ' "' || course_title || '" kursiga yozildi',
            NEW.course_id,
            NEW.id,
            jsonb_build_object(
                'student_id', NEW.student_id,
                'course_id', NEW.course_id,
                'enrolled_at', NEW.enrolled_at
            )
        );
    END IF;
    
    -- Update enrollment count on courses table
    UPDATE public.courses
    SET enrollment_count = enrollment_count + 1
    WHERE id = NEW.course_id;
    
    RETURN NEW;
END;
$$;

-- Function to create notification for quiz completion
CREATE OR REPLACE FUNCTION public.notify_quiz_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    course_title TEXT;
    teacher_id UUID;
    student_name TEXT;
BEGIN
    -- Get course details
    SELECT title, teacher_id INTO course_title, teacher_id
    FROM public.courses
    WHERE id = NEW.course_id;
    
    -- Get student name
    SELECT full_name INTO student_name
    FROM public.user_profiles
    WHERE id = NEW.student_id;
    
    -- Create notification for teacher
    IF teacher_id IS NOT NULL THEN
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
            teacher_id,
            NEW.student_id,
            'quiz_completion'::public.notification_type,
            'Test topshirildi',
            student_name || ' "' || course_title || '" kursida testni yakunladi. Natija: ' || NEW.percentage || '%',
            NEW.course_id,
            NEW.id,
            jsonb_build_object(
                'student_id', NEW.student_id,
                'course_id', NEW.course_id,
                'score', NEW.score,
                'max_score', NEW.max_score,
                'percentage', NEW.percentage,
                'completed_at', NEW.completed_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Function to create notification for assignment submission
CREATE OR REPLACE FUNCTION public.notify_assignment_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    course_title TEXT;
    teacher_id UUID;
    student_name TEXT;
BEGIN
    -- Get course details
    SELECT title, teacher_id INTO course_title, teacher_id
    FROM public.courses
    WHERE id = NEW.course_id;
    
    -- Get student name
    SELECT full_name INTO student_name
    FROM public.user_profiles
    WHERE id = NEW.student_id;
    
    -- Create notification for teacher
    IF teacher_id IS NOT NULL THEN
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
            teacher_id,
            NEW.student_id,
            'assignment_submission'::public.notification_type,
            'Topshiriq topshirildi',
            student_name || ' "' || course_title || '" kursida topshiriq topshirdi',
            NEW.course_id,
            NEW.id,
            jsonb_build_object(
                'student_id', NEW.student_id,
                'course_id', NEW.course_id,
                'submitted_at', NEW.submitted_at
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 8. Attach triggers to tables

DROP TRIGGER IF EXISTS trigger_notify_enrollment ON public.enrollments;
CREATE TRIGGER trigger_notify_enrollment
    AFTER INSERT ON public.enrollments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_enrollment();

DROP TRIGGER IF EXISTS trigger_notify_quiz_completion ON public.quiz_completions;
CREATE TRIGGER trigger_notify_quiz_completion
    AFTER INSERT ON public.quiz_completions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_quiz_completion();

DROP TRIGGER IF EXISTS trigger_notify_assignment_submission ON public.assignment_submissions;
CREATE TRIGGER trigger_notify_assignment_submission
    AFTER INSERT ON public.assignment_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_assignment_submission();

-- 9. Enable RLS on all tables

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies

-- Enrollments policies
DROP POLICY IF EXISTS "students_manage_own_enrollments" ON public.enrollments;
CREATE POLICY "students_manage_own_enrollments"
ON public.enrollments
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "teachers_view_course_enrollments" ON public.enrollments;
CREATE POLICY "teachers_view_course_enrollments"
ON public.enrollments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = enrollments.course_id
        AND c.teacher_id = auth.uid()
    )
);

-- Quiz completions policies
DROP POLICY IF EXISTS "students_manage_own_quiz_completions" ON public.quiz_completions;
CREATE POLICY "students_manage_own_quiz_completions"
ON public.quiz_completions
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "teachers_view_course_quiz_completions" ON public.quiz_completions;
CREATE POLICY "teachers_view_course_quiz_completions"
ON public.quiz_completions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = quiz_completions.course_id
        AND c.teacher_id = auth.uid()
    )
);

-- Assignment submissions policies
DROP POLICY IF EXISTS "students_manage_own_submissions" ON public.assignment_submissions;
CREATE POLICY "students_manage_own_submissions"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "teachers_manage_course_submissions" ON public.assignment_submissions;
CREATE POLICY "teachers_manage_course_submissions"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = assignment_submissions.course_id
        AND c.teacher_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = assignment_submissions.course_id
        AND c.teacher_id = auth.uid()
    )
);

-- Notifications policies
DROP POLICY IF EXISTS "users_manage_own_notifications" ON public.notifications;
CREATE POLICY "users_manage_own_notifications"
ON public.notifications
FOR ALL
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- 11. Enable real-time for notifications table
-- This allows clients to subscribe to real-time changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.quiz_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.assignment_submissions;

-- 12. Create helper function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.notifications
    SET status = 'read'::public.notification_status,
        read_at = CURRENT_TIMESTAMP
    WHERE id = notification_id
    AND recipient_id = auth.uid();
END;
$$;

-- 13. Create helper function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    count INTEGER;
BEGIN
    SELECT COUNT(*) INTO count
    FROM public.notifications
    WHERE recipient_id = auth.uid()
    AND status = 'unread'::public.notification_status;
    
    RETURN count;
END;
$$;