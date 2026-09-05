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

// Ba'zi brauzerlar (ayniqsa Safari) 'uz' locale uchun to'liq oy nomlariga ega
// emas — Intl "sentabr" o'rniga "M09" fallback beradi. Shuning uchun o'zbekcha oy
// nomlarini o'zimiz beramiz (izchil "5-sentabr, 2026" ko'rinishi hamma joyda).
const UZ_MONTHS_LONG = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];
const UZ_MONTHS_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

// Berilgan sanani (Tashkent TZ) kun/oy/yil raqamlariga ajratadi — son qismlari
// barcha brauzerda ishonchli (faqat oy NOMI muammoli).
function dateParts(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { day: Number(get('day')), month: Number(get('month')), year: Number(get('year')) };
}

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
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    // O'zbekcha oy NOMI kerak bo'lsa — o'zimiz formatlaymiz (brauzer Intl'iga
    // ishonmaymiz). Faqat toza sana (weekday/vaqt yo'q) uchun; boshqasi Intl'da.
    if (
      locale === 'uz' &&
      (opts.month === 'long' || opts.month === 'short') &&
      !opts.weekday && !opts.hour && !opts.minute && !opts.second
    ) {
      const tz = opts.timeZone ?? TASHKENT_TZ;
      const { day, month, year } = dateParts(date, tz);
      const name = (opts.month === 'long' ? UZ_MONTHS_LONG : UZ_MONTHS_SHORT)[month - 1];
      const head = opts.day ? `${day}-${name}` : name;
      return opts.year ? `${head}, ${year}` : head;
    }
    return date.toLocaleDateString(tag(locale), withTz(opts));
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
