-- Course Topics Table Migration
-- Stores individual topics/lessons for each course

CREATE TABLE IF NOT EXISTS public.course_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    order_index INTEGER NOT NULL DEFAULT 1,
    duration TEXT DEFAULT '0 min',
    content TEXT DEFAULT '',
    has_quiz BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_topics_course_id ON public.course_topics(course_id);
CREATE INDEX IF NOT EXISTS idx_course_topics_order ON public.course_topics(course_id, order_index);

-- Enable RLS
ALTER TABLE public.course_topics ENABLE ROW LEVEL SECURITY;

-- Teachers can manage topics for their own courses
DROP POLICY IF EXISTS "teachers_manage_own_course_topics" ON public.course_topics;
CREATE POLICY "teachers_manage_own_course_topics"
ON public.course_topics
FOR ALL
TO authenticated
USING (
    course_id IN (
        SELECT id FROM public.courses WHERE teacher_id = auth.uid()
    )
)
WITH CHECK (
    course_id IN (
        SELECT id FROM public.courses WHERE teacher_id = auth.uid()
    )
);

-- Students can view topics of published courses
DROP POLICY IF EXISTS "students_view_published_course_topics" ON public.course_topics;
CREATE POLICY "students_view_published_course_topics"
ON public.course_topics
FOR SELECT
TO authenticated
USING (
    course_id IN (
        SELECT id FROM public.courses WHERE is_published = true
    )
);

-- Admins can view all topics
DROP POLICY IF EXISTS "admins_view_all_topics" ON public.course_topics;
CREATE POLICY "admins_view_all_topics"
ON public.course_topics
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_course_topic_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_course_topic_timestamp ON public.course_topics;
CREATE TRIGGER trigger_update_course_topic_timestamp
BEFORE UPDATE ON public.course_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_course_topic_timestamp();
