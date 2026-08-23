/**
 * Yengil, dependency'siz input validatsiya yordamchilari.
 *
 * Loyihada zod hali yo'q; bu modul markazlashtirilgan, izchil tekshiruvlar beradi.
 * Kelajakda zod-sxema qatlamiga ko'chirish uchun API shu ko'rinishda saqlangan.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isUuid(v: unknown): v is string {
  return typeof v === 'string' && UUID_RE.test(v);
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isEmail(v: unknown): v is string {
  return typeof v === 'string' && EMAIL_RE.test(v.trim());
}

/** Email'ni izchil normallashtiradi (lowercase + trim). */
export function normalizeEmail(v: string): string {
  return v.toLowerCase().trim();
}

export function isOneOf<T extends readonly string[]>(v: unknown, allowed: T): v is T[number] {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v);
}
