-- Migration: Create course_tests and test_questions tables
-- This migration adds the missing tables needed for the test creation feature

-- Create course_tests table
CREATE TABLE IF NOT EXISTS public.course_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 80 CHECK (passing_score >= 0 AND passing_score <= 100),
  moderation_status TEXT DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'draft')),
  submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create test_questions table
CREATE TABLE IF NOT EXISTS public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.course_tests(id) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_course_tests_teacher_id ON public.course_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_course_tests_course_id ON public.course_tests(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tests_moderation_status ON public.course_tests(moderation_status);
CREATE INDEX IF NOT EXISTS idx_test_questions_test_id ON public.test_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_test_questions_order ON public.test_questions(test_id, question_order);

-- Enable RLS
ALTER TABLE public.course_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_tests

-- Teachers can view their own tests
DROP POLICY IF EXISTS "Teachers can view own tests" ON public.course_tests;
CREATE POLICY "Teachers can view own tests"
  ON public.course_tests
  FOR SELECT
  USING (teacher_id = auth.uid());

-- Teachers can insert their own tests
DROP POLICY IF EXISTS "Teachers can insert own tests" ON public.course_tests;
CREATE POLICY "Teachers can insert own tests"
  ON public.course_tests
  FOR INSERT
  WITH CHECK (
    teacher_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'teacher')
  );

-- Teachers can update their own tests
DROP POLICY IF EXISTS "Teachers can update own tests" ON public.course_tests;
CREATE POLICY "Teachers can update own tests"
  ON public.course_tests
  FOR UPDATE
  USING (teacher_id = auth.uid());

-- Teachers can delete their own tests
DROP POLICY IF EXISTS "Teachers can delete own tests" ON public.course_tests;
CREATE POLICY "Teachers can delete own tests"
  ON public.course_tests
  FOR DELETE
  USING (teacher_id = auth.uid());

-- Admins can view all tests
DROP POLICY IF EXISTS "Admins can view all tests" ON public.course_tests;
CREATE POLICY "Admins can view all tests"
  ON public.course_tests
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all tests (for moderation)
DROP POLICY IF EXISTS "Admins can update all tests" ON public.course_tests;
CREATE POLICY "Admins can update all tests"
  ON public.course_tests
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Students can view approved tests for enrolled courses
DROP POLICY IF EXISTS "Students can view approved tests" ON public.course_tests;
CREATE POLICY "Students can view approved tests"
  ON public.course_tests
  FOR SELECT
  USING (
    moderation_status = 'approved' AND
    course_id IN (
      SELECT course_id FROM public.enrollments WHERE student_id = auth.uid()
    )
  );

-- RLS Policies for test_questions

-- Teachers can view questions for their own tests
DROP POLICY IF EXISTS "Teachers can view own test questions" ON public.test_questions;
CREATE POLICY "Teachers can view own test questions"
  ON public.test_questions
  FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM public.course_tests WHERE teacher_id = auth.uid()
    )
  );

-- Teachers can insert questions for their own tests
DROP POLICY IF EXISTS "Teachers can insert own test questions" ON public.test_questions;
CREATE POLICY "Teachers can insert own test questions"
  ON public.test_questions
  FOR INSERT
  WITH CHECK (
    test_id IN (
      SELECT id FROM public.course_tests WHERE teacher_id = auth.uid()
    )
  );

-- Teachers can update questions for their own tests
DROP POLICY IF EXISTS "Teachers can update own test questions" ON public.test_questions;
CREATE POLICY "Teachers can update own test questions"
  ON public.test_questions
  FOR UPDATE
  USING (
    test_id IN (
      SELECT id FROM public.course_tests WHERE teacher_id = auth.uid()
    )
  );

-- Teachers can delete questions for their own tests
DROP POLICY IF EXISTS "Teachers can delete own test questions" ON public.test_questions;
CREATE POLICY "Teachers can delete own test questions"
  ON public.test_questions
  FOR DELETE
  USING (
    test_id IN (
      SELECT id FROM public.course_tests WHERE teacher_id = auth.uid()
    )
  );

-- Admins can view all test questions
DROP POLICY IF EXISTS "Admins can view all test questions" ON public.test_questions;
CREATE POLICY "Admins can view all test questions"
  ON public.test_questions
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Students can view questions for approved tests in enrolled courses
DROP POLICY IF EXISTS "Students can view approved test questions" ON public.test_questions;
CREATE POLICY "Students can view approved test questions"
  ON public.test_questions
  FOR SELECT
  USING (
    test_id IN (
      SELECT id FROM public.course_tests
      WHERE moderation_status = 'approved'
      AND course_id IN (
        SELECT course_id FROM public.enrollments WHERE student_id = auth.uid()
      )
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_course_tests_updated_at ON public.course_tests;
CREATE TRIGGER update_course_tests_updated_at
  BEFORE UPDATE ON public.course_tests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_test_questions_updated_at ON public.test_questions;
CREATE TRIGGER update_test_questions_updated_at
  BEFORE UPDATE ON public.test_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();