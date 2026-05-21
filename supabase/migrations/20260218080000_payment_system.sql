-- Payment System Migration
-- Adds support for Click and Payme payment gateways with transaction tracking and course enrollments

-- 1. Create payment gateway enum
DO $$ BEGIN
    CREATE TYPE public.payment_gateway AS ENUM ('click', 'payme');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create payment status enum
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM (
        'pending',      -- To'lov kutilmoqda
        'processing',   -- To'lov jarayonda
        'completed',    -- To'lov muvaffaqiyatli
        'failed',       -- To'lov muvaffaqiyatsiz
        'cancelled',    -- To'lov bekor qilindi
        'refunded'      -- To'lov qaytarildi
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create payment_transactions table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    
    -- Payment details
    payment_gateway public.payment_gateway NOT NULL,
    amount_usd DECIMAL(10,2) NOT NULL,
    amount_uzs BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'UZS',
    
    -- Transaction status
    status public.payment_status NOT NULL DEFAULT 'pending'::public.payment_status,
    
    -- Gateway-specific data
    gateway_transaction_id TEXT,
    gateway_payment_id TEXT,
    gateway_response JSONB,
    
    -- Error tracking
    error_message TEXT,
    error_code TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_amount_usd CHECK (amount_usd >= 0),
    CONSTRAINT valid_amount_uzs CHECK (amount_uzs >= 0)
);

-- 4. Create course_enrollments table
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    
    -- Enrollment details
    enrolled_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    progress DECIMAL(5,2) DEFAULT 0,
    completed_at TIMESTAMPTZ,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,
    
    -- Constraints
    CONSTRAINT unique_user_course_enrollment UNIQUE(user_id, course_id),
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- 5. Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_course_id ON public.payment_transactions(course_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway ON public.payment_transactions(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_transaction_id ON public.payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_payment_transaction_id ON public.course_enrollments(payment_transaction_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_enrolled_at ON public.course_enrollments(enrolled_at DESC);

-- 6. Create trigger function for updating payment transaction timestamps
CREATE OR REPLACE FUNCTION public.update_payment_transaction_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.updated_at := CURRENT_TIMESTAMP;
    
    IF NEW.status = 'completed'::public.payment_status AND OLD.status != 'completed'::public.payment_status THEN
        NEW.completed_at := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 7. Attach trigger to payment_transactions table
DROP TRIGGER IF EXISTS trigger_update_payment_transaction_timestamp ON public.payment_transactions;
CREATE TRIGGER trigger_update_payment_transaction_timestamp
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_transaction_timestamp();

-- 8. Create function to automatically enroll user after successful payment
CREATE OR REPLACE FUNCTION public.auto_enroll_after_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status = 'completed'::public.payment_status AND OLD.status != 'completed'::public.payment_status THEN
        INSERT INTO public.course_enrollments (user_id, course_id, payment_transaction_id)
        VALUES (NEW.user_id, NEW.course_id, NEW.id)
        ON CONFLICT (user_id, course_id) DO NOTHING;
        
        UPDATE public.courses
        SET enrollment_count = enrollment_count + 1
        WHERE id = NEW.course_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 9. Attach trigger for auto-enrollment
DROP TRIGGER IF EXISTS trigger_auto_enroll_after_payment ON public.payment_transactions;
CREATE TRIGGER trigger_auto_enroll_after_payment
    AFTER UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_enroll_after_payment();

-- 10. Enable RLS on payment_transactions table
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- 11. Enable RLS on course_enrollments table
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- 12. RLS Policies for payment_transactions table

-- Users can view their own payment transactions
DROP POLICY IF EXISTS "users_view_own_transactions" ON public.payment_transactions;
CREATE POLICY "users_view_own_transactions"
    ON public.payment_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own payment transactions
DROP POLICY IF EXISTS "users_create_own_transactions" ON public.payment_transactions;
CREATE POLICY "users_create_own_transactions"
    ON public.payment_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- System can update payment transactions (for webhook processing)
DROP POLICY IF EXISTS "system_update_transactions" ON public.payment_transactions;
CREATE POLICY "system_update_transactions"
    ON public.payment_transactions
    FOR UPDATE
    USING (true);

-- Admins can view all transactions
DROP POLICY IF EXISTS "admins_view_all_transactions" ON public.payment_transactions;
CREATE POLICY "admins_view_all_transactions"
    ON public.payment_transactions
    FOR SELECT
    USING (public.is_admin());

-- 13. RLS Policies for course_enrollments table

-- Users can view their own enrollments
DROP POLICY IF EXISTS "users_view_own_enrollments" ON public.course_enrollments;
CREATE POLICY "users_view_own_enrollments"
    ON public.course_enrollments
    FOR SELECT
    USING (auth.uid() = user_id);

-- System can create enrollments (triggered by payment completion)
DROP POLICY IF EXISTS "system_create_enrollments" ON public.course_enrollments;
CREATE POLICY "system_create_enrollments"
    ON public.course_enrollments
    FOR INSERT
    WITH CHECK (true);

-- Users can update their own enrollment progress
DROP POLICY IF EXISTS "users_update_own_enrollments" ON public.course_enrollments;
CREATE POLICY "users_update_own_enrollments"
    ON public.course_enrollments
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Teachers can view enrollments for their courses
DROP POLICY IF EXISTS "teachers_view_course_enrollments" ON public.course_enrollments;
CREATE POLICY "teachers_view_course_enrollments"
    ON public.course_enrollments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = course_enrollments.course_id
            AND courses.teacher_id = auth.uid()
        )
    );

-- Admins can view all enrollments
DROP POLICY IF EXISTS "admins_view_all_enrollments" ON public.course_enrollments;
CREATE POLICY "admins_view_all_enrollments"
    ON public.course_enrollments
    FOR SELECT
    USING (public.is_admin());

-- 14. Create function to check if user is enrolled in course
CREATE OR REPLACE FUNCTION public.is_user_enrolled(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.course_enrollments
        WHERE user_id = p_user_id AND course_id = p_course_id
    );
END;
$$;

-- 15. Create function to get user's payment history
CREATE OR REPLACE FUNCTION public.get_user_payment_history(p_user_id UUID)
RETURNS TABLE (
    transaction_id UUID,
    course_title TEXT,
    amount_usd DECIMAL,
    amount_uzs BIGINT,
    payment_gateway TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        c.title,
        pt.amount_usd,
        pt.amount_uzs,
        pt.payment_gateway::TEXT,
        pt.status::TEXT,
        pt.created_at,
        pt.completed_at
    FROM public.payment_transactions pt
    JOIN public.courses c ON pt.course_id = c.id
    WHERE pt.user_id = p_user_id
    ORDER BY pt.created_at DESC;
END;
$$;