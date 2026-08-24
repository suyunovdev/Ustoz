/**
 * GET /api/auth/google — Google OAuth oqimini boshlaydi.
 * CSRF himoyasi: tasodifiy `state` cookie'ga yoziladi va Google'ga uzatiladi;
 * callback'da moslik tekshiriladi.
 */
import { NextResponse } from 'next/server';
import { isGoogleOAuthConfigured, buildGoogleAuthUrl, appUrl, OAUTH_STATE_COOKIE } from '@/lib/oauth/google';

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(appUrl('/login?error=oauth_not_configured'));
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
