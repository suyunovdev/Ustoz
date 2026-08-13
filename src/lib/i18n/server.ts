import { cookies } from 'next/headers';
import { type Locale, DEFAULT_LOCALE, getTranslation, type TParams } from './index';

/**
 * Server komponentlar uchun locale — `ustoz_lang` cookie'sidan o'qiladi.
 * (Client'da localStorage; server'da faqat cookie mavjud.)
 */
export async function getServerLocale(): Promise<Locale> {
  try {
    const store = await cookies();
    const v = store.get('ustoz_lang')?.value;
    if (v === 'uz' || v === 'ru' || v === 'en') return v;
  } catch {
    // cookies() faqat dynamic kontekstda ishlaydi
  }
  return DEFAULT_LOCALE;
}

/** Server komponentlar uchun tarjima — getServerLocale bilan birga */
export async function getServerT(): Promise<(key: string, params?: TParams) => string> {
  const locale = await getServerLocale();
  return (key: string, params?: TParams) => getTranslation(locale, key, params);
}
