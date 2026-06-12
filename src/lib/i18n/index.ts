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

type Messages = typeof uz;

const messages: Record<Locale, Messages> = { uz, ru, en };

/**
 * Nested key orqali tarjima olish.
 * Masalan: t('auth.login') → "Kirish"
 */
export function getTranslation(locale: Locale, key: string): string {
  const parts = key.split('.');
  let current: unknown = messages[locale] || messages[DEFAULT_LOCALE];

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key; // fallback: key o'zini qaytaradi
    }
  }

  return typeof current === 'string' ? current : key;
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
}
