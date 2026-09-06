/**
 * Yengil, dependency'siz input validatsiya yordamchilari.
 *
 * Loyihada zod hali yo'q; bu modul markazlashtirilgan, izchil tekshiruvlar beradi.
 * Kelajakda zod-sxema qatlamiga ko'chirish uchun API shu ko'rinishda saqlangan.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Kuchaytirilgan: local + @ + domen (kamida bitta nuqta) + TLD (2–24 harf).
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,24}$/;

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isEmail(v: unknown): v is string {
  if (typeof v !== 'string') return false;
  const e = v.trim();
  if (e.length < 6 || e.length > 254) return false;
  if (!EMAIL_RE.test(e)) return false;
  const at = e.indexOf('@');
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  // Ketma-ket nuqta yoki bosh/oxir nuqtani rad etamiz
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  if (domain.startsWith('.') || domain.endsWith('.') || domain.includes('..') || domain.startsWith('-')) return false;
  return true;
}

// Keng tarqalgan yozuv xatolarini tuzatib taklif qiladi (gmail.con → gmail.com).
// Xato bo'lmasa null. UI'da "Balki {suggestion}?" ko'rinishida ishlatiladi.
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com',
  'gmaill.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.comm': 'gmail.com',
  'gmail.om': 'gmail.com', 'gmailc.om': 'gmail.com',
  'yaho.com': 'yahoo.com', 'yahooo.com': 'yahoo.com', 'yahoo.con': 'yahoo.com', 'yahoo.co': 'yahoo.com',
  'hotmial.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmail.co': 'hotmail.com',
  'outlok.com': 'outlook.com', 'outook.com': 'outlook.com', 'outlook.con': 'outlook.com',
  'iclould.com': 'icloud.com', 'icloud.con': 'icloud.com', 'mial.ru': 'mail.ru',
};
const TLD_TYPOS: Record<string, string> = {
  con: 'com', cmo: 'com', vom: 'com', xom: 'com', comm: 'com', ocm: 'com', om: 'com',
  nte: 'net', ne: 'net', orgg: 'org',
};

export function suggestEmailFix(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const e = v.trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1 || at === e.length - 1) return null;
  const local = e.slice(0, at);
  let domain = e.slice(at + 1);
  if (DOMAIN_TYPOS[domain]) {
    domain = DOMAIN_TYPOS[domain];
  } else {
    const parts = domain.split('.');
    const tld = parts[parts.length - 1];
    if (TLD_TYPOS[tld]) {
      parts[parts.length - 1] = TLD_TYPOS[tld];
      domain = parts.join('.');
    }
  }
  const fixed = `${local}@${domain}`;
  return fixed !== e ? fixed : null;
}

/** Email'ni izchil normallashtiradi (lowercase + trim). */
export function normalizeEmail(v: string): string {
  return v.toLowerCase().trim();
}

export function isOneOf<T extends readonly string[]>(v: unknown, allowed: T): v is T[number] {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v);
}

/**
 * Yagona parol siyosati — barcha oqimlar (register, OTP-signup, parol tiklash,
 * parol almashtirish) shu funksiyani ishlatishi kerak. Xato bo'lsa xabar (string),
 * to'g'ri bo'lsa null qaytaradi.
 */
export function validatePassword(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 8) {
    return "Parol kamida 8 ta belgidan iborat bo'lishi kerak";
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Parol kamida 1 ta katta harf, 1 ta kichik harf va 1 ta raqam bo'lishi kerak";
  }
  return null;
}
