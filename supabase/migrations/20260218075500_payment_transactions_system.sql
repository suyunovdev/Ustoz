-- Payment Transactions System Migration
-- Supports Click and Payme payment gateways
-- Timestamp: 20260218075500

-- 1. Create payment method enum
DROP TYPE IF EXISTS public.payment_method CASCADE;
CREATE TYPE public.payment_method AS ENUM ('click', 'payme');

DROP TYPE IF EXISTS public.transaction_status CASCADE;
CREATE TYPE public.transaction_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded');

-- 2. Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    -- Transaction details
    amount_uzs BIGINT NOT NULL CHECK (amount_uzs > 0),
    payment_method public.payment_method NOT NULL,
    status public.transaction_status NOT NULL DEFAULT 'pending'::public.transaction_status,
    
    -- Gateway-specific data
    gateway_transaction_id TEXT,
    gateway_payment_id TEXT,
    merchant_trans_id TEXT UNIQUE,
    
    -- Click-specific fields
    click_trans_id BIGINT,
    click_paydoc_id BIGINT,
    
    -- Payme-specific fields
    payme_transaction_id TEXT,
    payme_time BIGINT,
    
    -- Additional metadata
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_student_id ON public.payment_transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_course_id ON public.payment_transactions(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_merchant_trans_id ON public.payment_transactions(merchant_trans_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_click_trans_id ON public.payment_transactions(click_trans_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payme_transaction_id ON public.payment_transactions(payme_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- 4. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_payment_transaction_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- 5. Create function to auto-enroll student on successful payment
CREATE OR REPLACE FUNCTION public.auto_enroll_on_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only enroll if payment is completed and enrollment doesn't exist
    IF NEW.status = 'completed'::public.transaction_status AND 
       (OLD.status IS NULL OR OLD.status != 'completed'::public.transaction_status) THEN
        
        -- Check if enrollment already exists
        IF NOT EXISTS (
            SELECT 1 FROM public.enrollments 
            WHERE student_id = NEW.student_id AND course_id = NEW.course_id
        ) THEN
            -- Create enrollment
            INSERT INTO public.enrollments (student_id, course_id, enrolled_at, is_active)
            VALUES (NEW.student_id, NEW.course_id, CURRENT_TIMESTAMP, true)
            ON CONFLICT (student_id, course_id) DO NOTHING;
            
            -- Increment course enrollment count
            UPDATE public.courses 
            SET enrollment_count = enrollment_count + 1
            WHERE id = NEW.course_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 6. Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
DROP POLICY IF EXISTS "users_view_own_transactions" ON public.payment_transactions;
CREATE POLICY "users_view_own_transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "users_create_own_transactions" ON public.payment_transactions;
CREATE POLICY "users_create_own_transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "system_update_transactions" ON public.payment_transactions;
CREATE POLICY "system_update_transactions"
ON public.payment_transactions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 8. Create triggers
DROP TRIGGER IF EXISTS update_payment_transaction_timestamp_trigger ON public.payment_transactions;
CREATE TRIGGER update_payment_transaction_timestamp_trigger
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_transaction_timestamp();

DROP TRIGGER IF EXISTS auto_enroll_on_payment_trigger ON public.payment_transactions;
CREATE TRIGGER auto_enroll_on_payment_trigger
    AFTER INSERT OR UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_enroll_on_payment();

-- 9. Add unique constraint to enrollments if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'enrollments_student_course_unique'
    ) THEN
        ALTER TABLE public.enrollments 
        ADD CONSTRAINT enrollments_student_course_unique 
        UNIQUE (student_id, course_id);
    END IF;
END $$;

-- 10. Mock data for testing
DO $$
DECLARE
    test_student_id UUID;
    test_course_id UUID;
    test_transaction_id UUID := gen_random_uuid();
BEGIN
    -- Get existing student and course
    SELECT id INTO test_student_id FROM public.user_profiles WHERE role = 'student'::public.user_role LIMIT 1;
    SELECT id INTO test_course_id FROM public.courses WHERE is_published = true LIMIT 1;
    
    IF test_student_id IS NOT NULL AND test_course_id IS NOT NULL THEN
        -- Create sample pending transaction
        INSERT INTO public.payment_transactions (
            id,
            student_id,
            course_id,
            amount_uzs,
            payment_method,
            status,
            merchant_trans_id,
            metadata
        ) VALUES (
            test_transaction_id,
            test_student_id,
            test_course_id,
            500000,
            'click'::public.payment_method,
            'pending'::public.transaction_status,
            'TEST_' || test_transaction_id::TEXT,
            jsonb_build_object('test', true, 'description', 'Sample transaction for testing')
        )
        ON CONFLICT (merchant_trans_id) DO NOTHING;
    ELSE
        RAISE NOTICE 'No student or course found for mock transaction data';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Mock transaction data insertion failed: %', SQLERRM;
END $$;