/**
 * GET /api/auth/google — Google OAuth oqimini boshlaydi.
 * CSRF himoyasi: tasodifiy `state` cookie'ga yoziladi va Google'ga uzatiladi;
 * callback'da moslik tekshiriladi.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isGoogleOAuthConfigured, buildGoogleAuthUrl } from '@/lib/oauth/google';

export const OAUTH_STATE_COOKIE = 'g_oauth_state';

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', req.url));
  }

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(buildGoogleAuthUrl(state));

  const useSecure = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');
  res.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax', // Google'dan qaytishda (top-level GET) cookie yuborilishi uchun
    secure: useSecure,
    path: '/',
    maxAge: 10 * 60, // 10 daqiqa
  });
  return res;
}
