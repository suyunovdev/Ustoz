-- Fix OTP security: remove overly permissive anon read policy
-- The verify-otp route uses server-side (service role via createClient) 
-- so anon direct read is not needed and is a security risk

DROP POLICY IF EXISTS "Anon can read otp by email" ON public.otp_codes;

-- Add rate limiting columns for brute-force protection
ALTER TABLE public.otp_codes 
  ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until timestamptz;

-- Only service role can access otp_codes (API routes use server client)
-- This means no direct client-side reads of OTP codes
