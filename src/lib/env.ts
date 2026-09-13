/**
 * Muhit o'zgaruvchilarini tekshirish
 * App start paytida kerakli env var'lar mavjudligini ta'minlaydi
 */

// KRITIK: ularsiz ilova umuman ishlay olmaydi — prod'da fail-closed (throw).
const criticalServerEnvVars = ['DATABASE_URL', 'JWT_SECRET'] as const;

// IXTIYORIY: sozlanmasa tegishli funksiya o'chadi (to'lov/email), lekin ilova
// ishlayveradi (masalan to'lov shlyuzi hali ulanmagan bo'lishi mumkin). Faqat warn.
const optionalServerEnvVars = [
  'NEXT_PUBLIC_APP_URL',
  'CLICK_MERCHANT_ID',
  'CLICK_SERVICE_ID',
  'CLICK_SECRET_KEY',
  'PAYME_MERCHANT_ID',
  'PAYME_KEY',
  'RESEND_API_KEY',
] as const;

function findMissing(keys: readonly string[]): string[] {
  return keys.filter((key) => {
    const value = process.env[key];
    return !value || value.startsWith('your-') || value === '';
  });
}

export function validateEnv(): void {
  // Faqat server tomonida tekshirish (build paytida ham)
  if (typeof window !== 'undefined') return;

  const isProd = process.env.NODE_ENV === 'production';

  // Kritik o'zgaruvchilar: prod'da yo'q bo'lsa ishga tushishga yo'l qo'ymaymiz.
  const missingCritical = findMissing(criticalServerEnvVars);
  if (missingCritical.length > 0) {
    const message = `[ustoz] KRITIK muhit o'zgaruvchilari sozlanmagan:\n${missingCritical.map((k) => `  - ${k}`).join('\n')}\n.env faylini tekshiring.`;
    if (isProd) throw new Error(message);
    console.warn(message);
  }

  // Ixtiyoriy o'zgaruvchilar: har doim faqat ogohlantirish (ilovani to'xtatmaydi).
  const missingOptional = findMissing(optionalServerEnvVars);
  if (missingOptional.length > 0) {
    console.warn(
      `[ustoz] Ixtiyoriy muhit o'zgaruvchilari sozlanmagan (tegishli funksiya o'chadi):\n${missingOptional.map((k) => `  - ${k}`).join('\n')}`,
    );
  }
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4028',
  clickMerchantId: process.env.CLICK_MERCHANT_ID || '',
  clickServiceId: process.env.CLICK_SERVICE_ID || '',
  clickSecretKey: process.env.CLICK_SECRET_KEY || '',
  paymeMerchantId: process.env.PAYME_MERCHANT_ID || '',
  paymeKey: process.env.PAYME_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '',
} as const;
