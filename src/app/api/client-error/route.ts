/**
 * POST /api/client-error — brauzer (client) xatolarini serverga yozadi.
 *
 * Sentry/DSN talab qilmaydigan yengil monitoring: client'dagi ushlanmagan xatolar
 * server loglariga (PM2) tushadi, shunda prod muammolari ko'rinadi. Rate-limit +
 * hajm cheklovi — abuzedan himoya. SENTRY_DSN qo'shilsa, kelajakda shu yerdan
 * to'g'ridan-to'g'ri Sentry'ga ham yuborish mumkin.
 */
import type { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/json';
import { checkRateLimit } from '@/lib/rateLimit';
import { getClientIp } from '@/lib/auth-helpers';

const MAX_LEN = 2000;
const clip = (v: unknown, max: number) =>
  typeof v === 'string' ? v.slice(0, max) : undefined;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? 'unknown';
  // Bir IP'dan daqiqasiga 20 tagacha — xato tsikllari log'ni bosib ketmasin
  const rl = await checkRateLimit(`client-error:${ip}`, 20, 60_000);
  if (!rl.allowed) return jsonResponse({ ok: false }, { status: 429 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonResponse({ ok: false }, { status: 400 });
  }

  const entry = {
    message: clip(body.message, 500) ?? '(no message)',
    stack: clip(body.stack, MAX_LEN),
    url: clip(body.url, 500),
    userAgent: clip(req.headers.get('user-agent'), 300),
    at: new Date().toISOString(),
    ip,
  };
  // PM2/serverning stderr'iga — markazlashtirilgan log yig'ish shu yerdan o'qiydi
  console.error('[client-error]', JSON.stringify(entry));
  return jsonResponse({ ok: true });
}
