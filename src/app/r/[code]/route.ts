/**
 * GET /r/[code] — referral redirect (public).
 *   - Cookie'ga referral code'ni 30 kun saqlaydi
 *   - Click tracking endpoint'iga POST (fire-and-forget)
 *   - Foydalanuvchini bosh sahifaga 307 redirect qiladi
 */

import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  // Click tracking (fire-and-forget)
  try {
    const proto = req.headers.get('x-forwarded-proto') ?? 'http';
    const host = req.headers.get('host') ?? 'localhost:4028';
    fetch(`${proto}://${host}/api/referrals/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: normalized }),
    }).catch(() => {});
  } catch {}

  // Redirect with cookie
  const baseUrl = new URL(req.url);
  const targetUrl = new URL('/', baseUrl);
  const res = NextResponse.redirect(targetUrl, 307);
  res.cookies.set('ref_code', normalized, {
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
  });
  return res;
}
