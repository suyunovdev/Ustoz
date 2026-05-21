-- Reconcile payment_transactions schema conflict
-- Migration 075500 created table with student_id
-- Migration 080000 tried to create with user_id (skipped due to IF NOT EXISTS)
-- This migration adds missing columns from 080000 to the existing 075500 table

-- Add columns from 080000 schema if they don't exist
ALTER TABLE public.payment_transactions
  ADD COLUMN IF NOT EXISTS payment_gateway TEXT,
  ADD COLUMN IF NOT EXISTS amount_usd DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'UZS',
  ADD COLUMN IF NOT EXISTS gateway_response JSONB,
  ADD COLUMN IF NOT EXISTS error_code TEXT;

-- Create course_enrollments if not exists (it references payment_transactions)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT unique_user_course_enrollment UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_enrollments" ON public.course_enrollments;
CREATE POLICY "users_view_own_enrollments"
  ON public.course_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "system_manage_enrollments" ON public.course_enrollments;
CREATE POLICY "system_manage_enrollments"
  ON public.course_enrollments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Fix auto-enroll trigger to work with student_id column
CREATE OR REPLACE FUNCTION public.auto_enroll_after_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Insert into old enrollments table (student_id)
    INSERT INTO public.enrollments (student_id, course_id, enrolled_at, is_active)
    VALUES (NEW.student_id, NEW.course_id, CURRENT_TIMESTAMP, true)
    ON CONFLICT (student_id, course_id) DO NOTHING;
    
    -- Also insert into new course_enrollments table (user_id)
    INSERT INTO public.course_enrollments (user_id, course_id, payment_transaction_id)
    VALUES (NEW.student_id, NEW.course_id, NEW.id)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_enroll_after_payment ON public.payment_transactions;
CREATE TRIGGER trigger_auto_enroll_after_payment
  AFTER UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_after_payment();
