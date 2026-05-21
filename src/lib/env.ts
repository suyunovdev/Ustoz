/**
 * Muhit o'zgaruvchilarini tekshirish
 * App start paytida kerakli env var'lar mavjudligini ta'minlaydi
 */

const requiredServerEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
  'CLICK_MERCHANT_ID',
  'CLICK_SERVICE_ID',
  'CLICK_SECRET_KEY',
  'PAYME_MERCHANT_ID',
  'PAYME_KEY',
  'RESEND_API_KEY',
] as const;

export function validateEnv(): void {
  // Faqat server tomonida tekshirish (build paytida ham)
  if (typeof window !== 'undefined') return;

  const missing: string[] = [];

  for (const key of requiredServerEnvVars) {
    const value = process.env[key];
    if (!value || value.startsWith('your-') || value === '') {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[ustoz] Quyidagi muhit o'zgaruvchilari sozlanmagan:\n${missing.map((k) => `  - ${k}`).join('\n')}\n.env faylini tekshiring.`
    );
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4028',
  clickMerchantId: process.env.CLICK_MERCHANT_ID || '',
  clickServiceId: process.env.CLICK_SERVICE_ID || '',
  clickSecretKey: process.env.CLICK_SECRET_KEY || '',
  paymeMerchantId: process.env.PAYME_MERCHANT_ID || '',
  paymeKey: process.env.PAYME_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
} as const;
