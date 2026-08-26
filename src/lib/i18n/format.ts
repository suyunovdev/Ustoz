/**
 * Locale-aware formatlash yordamchilari (sana, vaqt, son, valyuta).
 * Hardcoded 'uz-UZ' o'rniga foydalanuvchi tanlagan tilga mos formatlash.
 *
 * Client komponentlarda:  const { locale } = useI18n();  formatDate(iso, locale)
 * Server komponentlarda:  cookie'dan olingan locale'ni uzating.
 */
import { LOCALE_TAG, type Locale } from './index';

function tag(locale: Locale): string {
  return LOCALE_TAG[locale] ?? 'uz-UZ';
}

export function formatDate(
  value: string | number | Date | null | undefined,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  if (value === null || value === undefined || value === '') return '';
  try {
    return new Date(value).toLocaleDateString(tag(locale), opts);
  } catch {
    return '';
  }
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
): string {
  if (value === null || value === undefined || value === '') return '';
  try {
    return new Date(value).toLocaleString(tag(locale), opts);
  } catch {
    return '';
  }
}

export function formatTime(
  value: string | number | Date | null | undefined,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' },
): string {
  if (value === null || value === undefined || value === '') return '';
  try {
    return new Date(value).toLocaleTimeString(tag(locale), opts);
  } catch {
    return '';
  }
}

export function formatNumber(n: number, locale: Locale): string {
  return new Intl.NumberFormat(tag(locale)).format(n);
}

/**
 * Valyuta formatlash — platforma TO'LIQ so'mda.
 * UZS → "99 000 so'm" (Intl ba'zi muhitda "UZS" kodini berardi — biz doim "so'm"
 * ko'rsatamiz, izchillik uchun). USD (agar qolgan bo'lsa) → Intl $ formati.
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency: 'UZS' | 'USD' = 'UZS',
): string {
  if (currency === 'UZS') {
    return `${formatNumber(amount, locale)} so'm`;
  }
  try {
    return new Intl.NumberFormat(tag(locale), {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${formatNumber(amount, locale)} ${currency}`;
  }
}
