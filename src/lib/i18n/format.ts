/**
 * Locale-aware formatlash yordamchilari (sana, vaqt, son, valyuta).
 * Hardcoded 'uz-UZ' o'rniga foydalanuvchi tanlagan tilga mos formatlash.
 *
 * Client komponentlarda:  const { locale } = useI18n();  formatDate(iso, locale)
 * Server komponentlarda:  cookie'dan olingan locale'ni uzating.
 */
import { LOCALE_TAG, type Locale } from './index';

// Platforma auditoriyasi 100% O'zbekistonda (Asia/Tashkent, UTC+5, DST yo'q).
// Sana/vaqt DOIM Toshkent vaqtida ko'rsatiladi — aks holda server (RSC/SSR, prodda
// UTC) UTC sanani render qiladi va client (UTC+5) bilan farq qiladi (hydration/xato).
// Chaqiruvchi opts'da timeZone bersa (masalan heatmap 'UTC'), o'sha ustun turadi.
const TASHKENT_TZ = 'Asia/Tashkent';

function tag(locale: Locale): string {
  return LOCALE_TAG[locale] ?? 'uz-UZ';
}

function withTz(opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions {
  return { timeZone: TASHKENT_TZ, ...opts };
}

export function formatDate(
  value: string | number | Date | null | undefined,
  locale: Locale,
  opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string {
  if (value === null || value === undefined || value === '') return '';
  try {
    return new Date(value).toLocaleDateString(tag(locale), withTz(opts));
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
    return new Date(value).toLocaleString(tag(locale), withTz(opts));
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
    return new Date(value).toLocaleTimeString(tag(locale), withTz(opts));
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
