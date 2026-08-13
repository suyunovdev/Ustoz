import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';

export type Locale = 'uz' | 'ru' | 'en';

export const LOCALES: { code: Locale; label: string }[] = [
  { code: 'uz', label: "O'zbek" },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
];

export const DEFAULT_LOCALE: Locale = 'uz';

// BCP-47 teglar — Intl (sana/son/valyuta/plural) uchun
export const LOCALE_TAG: Record<Locale, string> = {
  uz: 'uz-UZ',
  ru: 'ru-RU',
  en: 'en-US',
};

type Messages = typeof uz;

const messages: Record<Locale, Messages> = { uz, ru, en };

export type TParams = Record<string, string | number>;

// Nested kalitni yechish (topilmasa undefined)
function resolveKey(obj: unknown, key: string): unknown {
  let current: unknown = obj;
  for (const part of key.split('.')) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

/**
 * Nested key orqali tarjima olish (interpolatsiya + plural + fallback bilan).
 *   t('auth.login')                         → "Kirish"
 *   t('teacher.slots', { count: 3 })        → "{count}" o'rniga 3
 *   plural obyekt: { one, few, many, other } → count'ga qarab tanlanadi
 * Kalit joriy tilda topilmasa → DEFAULT_LOCALE (uz), u ham bo'lmasa → kalitning o'zi.
 */
export function getTranslation(locale: Locale, key: string, params?: TParams): string {
  let value = resolveKey(messages[locale], key);

  // Fallback: joriy tilda yo'q bo'lsa — asosiy til (uz)
  if (value === undefined && locale !== DEFAULT_LOCALE) {
    value = resolveKey(messages[DEFAULT_LOCALE], key);
  }

  if (value === undefined) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[i18n] Kalit topilmadi: "${key}" (til: ${locale})`);
    }
    return key;
  }

  // Plural: qiymat { one, few, many, other } obyekti bo'lsa, count bo'yicha tanlaymiz
  if (value && typeof value === 'object' && params && params.count !== undefined) {
    const cat = new Intl.PluralRules(LOCALE_TAG[locale]).select(Number(params.count));
    const obj = value as Record<string, string>;
    value = obj[cat] ?? obj.other ?? key;
  }

  if (typeof value !== 'string') return key;

  let result: string = value;
  // Interpolatsiya: {name} → params.name
  if (params) {
    result = result.replace(/\{(\w+)\}/g, (m, k) =>
      k in params ? String(params[k]) : m,
    );
  }

  return result;
}

export function getLocaleFromStorage(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem('ustoz_lang');
  if (stored && (stored === 'uz' || stored === 'ru' || stored === 'en')) {
    return stored;
  }
  return DEFAULT_LOCALE;
}

export function saveLocaleToStorage(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ustoz_lang', locale);
  // Cookie ham — server (SSR, <html lang>) o'qishi uchun
  document.cookie = `ustoz_lang=${locale}; path=/; max-age=31536000; samesite=lax`;
}
