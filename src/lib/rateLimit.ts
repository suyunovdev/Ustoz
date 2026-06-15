/**
 * Rate limiter with Upstash Redis support
 * Upstash Redis mavjud bo'lsa — Redis orqali ishlaydi
 * Aks holda — in-memory fallback ishlatiladi
 */

// ---------------------------------------------------------------------------
// Upstash Redis REST API helper
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

async function redisCommand(args: (string | number)[]): Promise<unknown> {
  const res = await fetch(UPSTASH_URL!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN!}` },
    body: JSON.stringify(args),
  });

  if (!res.ok) {
    throw new Error(`Upstash Redis xatolik: ${res.status}`);
  }

  const data = await res.json();
  return data.result;
}

// ---------------------------------------------------------------------------
// In-memory fallback
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Eskirgan yozuvlarni tozalash (har 5 daqiqada)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimitMemory(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// ---------------------------------------------------------------------------
// Redis-based implementation
// ---------------------------------------------------------------------------

async function checkRateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const redisKey = `rate_limit:${key}`;
  const windowSec = Math.ceil(windowMs / 1000);

  const count = (await redisCommand(['INCR', redisKey])) as number;

  // Birinchi so'rov bo'lsa — TTL o'rnatamiz
  if (count === 1) {
    await redisCommand(['EXPIRE', redisKey, windowSec]);
  }

  const now = Date.now();
  const resetAt = now + windowSec * 1000;

  if (count > limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return { allowed: true, remaining: limit - count, resetAt };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * @param key      - Unikal kalit (IP, email, userId)
 * @param limit    - Ruxsat etilgan maksimal so'rovlar soni
 * @param windowMs - Vaqt oralig'i (millisekund)
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (useRedis) {
    return checkRateLimitRedis(key, limit, windowMs);
  }
  return checkRateLimitMemory(key, limit, windowMs);
}

/**
 * IP manzilini request'dan olish
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
