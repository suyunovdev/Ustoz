/**
 * Platforma sozlamalari — admin boshqaradigan key-value.
 * Hozircha: obunachi kurs chegirmasi foizi.
 */
import { prisma } from '@/lib/prisma';

export const KEY_SUBSCRIBER_DISCOUNT = 'subscriber_course_discount_pct';

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Obunachi kurs chegirmasi (0–100). DB sozlamasidan o'qiladi; sozlanmagan bo'lsa
 * env (SUBSCRIBER_COURSE_DISCOUNT_PCT), u ham yo'q bo'lsa 0.
 */
export async function getSubscriberCourseDiscountSetting(): Promise<number> {
  try {
    const row = await prisma.platformSetting.findUnique({ where: { key: KEY_SUBSCRIBER_DISCOUNT } });
    if (row) return clampPct(Number(row.value));
  } catch {
    // jadval hali yo'q bo'lsa — env'ga tushamiz
  }
  return clampPct(Number(process.env.SUBSCRIBER_COURSE_DISCOUNT_PCT));
}

export async function setSubscriberCourseDiscountSetting(pct: number): Promise<number> {
  const value = String(clampPct(pct));
  await prisma.platformSetting.upsert({
    where: { key: KEY_SUBSCRIBER_DISCOUNT },
    create: { key: KEY_SUBSCRIBER_DISCOUNT, value },
    update: { value },
  });
  return Number(value);
}

// ─────────────────────────────────────────────────────────────────────────
// Bunny Stream sozlamalari — admin UI orqali boshqariladi (env fallback bilan).
// Kalitlar DB'da (platform_settings) saqlanadi; bo'sh bo'lsa env ishlatiladi.
// ─────────────────────────────────────────────────────────────────────────
export const KEY_BUNNY_LIBRARY_ID = 'bunny_stream_library_id';
export const KEY_BUNNY_API_KEY = 'bunny_stream_api_key';
export const KEY_BUNNY_TOKEN_KEY = 'bunny_stream_token_key';

export interface BunnyConfig {
  libraryId: string;
  apiKey: string;
  tokenKey: string; // embed token authentication key (bo'sh bo'lsa apiKey ishlatiladi)
}

// Qisqa in-memory cache — har playback token so'rovida DB'ga bormaslik uchun.
let _bunnyCache: { value: BunnyConfig; at: number } | null = null;
const BUNNY_CACHE_MS = 30_000;

export function invalidateBunnyConfigCache(): void {
  _bunnyCache = null;
}

/**
 * Bunny config: avval DB (platform_settings), bo'sh bo'lsa env fallback.
 * tokenKey bo'sh bo'lsa apiKey qaytariladi (Bunny odatda shu bilan imzolaydi).
 */
export async function getBunnyConfig(): Promise<BunnyConfig> {
  if (_bunnyCache && Date.now() - _bunnyCache.at < BUNNY_CACHE_MS) {
    return _bunnyCache.value;
  }
  let db: Record<string, string> = {};
  try {
    const rows = await prisma.platformSetting.findMany({
      where: { key: { in: [KEY_BUNNY_LIBRARY_ID, KEY_BUNNY_API_KEY, KEY_BUNNY_TOKEN_KEY] } },
    });
    db = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    // jadval hali yo'q — env'ga tushamiz
  }
  const libraryId = db[KEY_BUNNY_LIBRARY_ID] || process.env.BUNNY_STREAM_LIBRARY_ID || '';
  const apiKey = db[KEY_BUNNY_API_KEY] || process.env.BUNNY_STREAM_API_KEY || '';
  const tokenKey =
    db[KEY_BUNNY_TOKEN_KEY] || process.env.BUNNY_STREAM_TOKEN_KEY || apiKey;
  const value: BunnyConfig = { libraryId, apiKey, tokenKey };
  _bunnyCache = { value, at: Date.now() };
  return value;
}

/**
 * Bunny sozlamalarini saqlash. Faqat berilgan (bo'sh bo'lmagan) qiymatlar
 * yoziladi — maxfiy kalitni bo'sh qoldirsa eski qiymat saqlanib qoladi.
 */
export async function setBunnySettings(input: {
  libraryId?: string;
  apiKey?: string;
  tokenKey?: string;
}): Promise<void> {
  const writes: Array<{ key: string; value: string }> = [];
  if (typeof input.libraryId === 'string' && input.libraryId.trim()) {
    writes.push({ key: KEY_BUNNY_LIBRARY_ID, value: input.libraryId.trim() });
  }
  if (typeof input.apiKey === 'string' && input.apiKey.trim()) {
    writes.push({ key: KEY_BUNNY_API_KEY, value: input.apiKey.trim() });
  }
  if (typeof input.tokenKey === 'string' && input.tokenKey.trim()) {
    writes.push({ key: KEY_BUNNY_TOKEN_KEY, value: input.tokenKey.trim() });
  }
  for (const w of writes) {
    await prisma.platformSetting.upsert({
      where: { key: w.key },
      create: { key: w.key, value: w.value },
      update: { value: w.value },
    });
  }
  invalidateBunnyConfigCache();
}
