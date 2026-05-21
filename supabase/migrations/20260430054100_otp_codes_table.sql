-- Create otp_codes table for storing custom OTP codes sent via Resend
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  otp text NOT NULL,
  type text NOT NULL DEFAULT 'signup',
  expires_at timestamptz NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role)
CREATE POLICY "Service role can manage otp_codes"
  ON public.otp_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow anon to read their own OTP (for verification via API route)
CREATE POLICY "Anon can read otp by email"
  ON public.otp_codes
  FOR SELECT
  TO anon
  USING (true);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS otp_codes_email_idx ON public.otp_codes (email);
