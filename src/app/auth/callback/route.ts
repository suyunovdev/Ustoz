/**
 * GET /auth/callback — Google OAuth callback (Authorization Code flow).
 *
 * Oqim: state (CSRF) tekshiruvi → code'ni token'ga almashtirish → userinfo →
 * email_verified talab → foydalanuvchini email bo'yicha topish yoki yaratish
 * (yangi → rol student) → bizning JWT sessiya cookie'si → rolga qarab redirect.
 *
 * Xatoliklar /login?error=... ga yo'naltiradi (foydalanuvchiga tushunarli xabar).
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, COOKIE_NAME } from '@/lib/auth';
import { normalizeEmail } from '@/lib/validation';
import {
  isGoogleOAuthConfigured,
  exchangeCodeForToken,
  fetchGoogleUserInfo,
  appUrl,
  OAUTH_STATE_COOKIE,
} from '@/lib/oauth/google';

// MUHIM: redirect'lar req.url'dan EMAS, appUrl()'dan (NEXT_PUBLIC_APP_URL) quriladi —
// nginx orqasida req.url ichki localhost:4028 bo'lib, foydalanuvchini localhost'ga tashlardi.
function loginError(code: string): NextResponse {
  const res = NextResponse.redirect(appUrl(`/login?error=${code}`));
  // state cookie'ni tozalaymiz
  res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(appUrl('/login?error=oauth_not_configured'));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error'); // foydalanuvchi rad etsa (access_denied)

  if (oauthError) return loginError('oauth_cancelled');
  if (!code || !state) return loginError('oauth_failed');

  // CSRF: state cookie bilan moslik
  const savedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) return loginError('oauth_state');

  try {
    const accessToken = await exchangeCodeForToken(code);
    const info = await fetchGoogleUserInfo(accessToken);

    if (!info.email || !info.emailVerified) {
      return loginError('oauth_email_unverified');
    }

    const email = normalizeEmail(info.email);

    // Foydalanuvchini topish yoki yaratish (yangi → rol student).
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });

    if (!user) {
      // OAuth foydalanuvchisi uchun parol yo'q — tasodifiy, foydalanib bo'lmaydigan
      // hash qo'yamiz (email+parol login imkonsiz; ular Google orqali kiradi).
      const randomHash = await bcrypt.hash(crypto.randomUUID() + crypto.randomUUID(), 12);
      const created = await prisma.user.create({
        data: {
          email,
          passwordHash: randomHash,
          role: 'student',
          profile: {
            create: {
              email,
              fullName: info.name || email.split('@')[0],
              role: 'student',
              avatarUrl: info.picture,
            },
          },
        },
        select: { id: true, email: true, role: true, tokenVersion: true },
      });
      user = created;
    } else if (info.picture) {
      // Mavjud foydalanuvchi — avatar bo'sh bo'lsa Google rasmini qo'yamiz (best-effort).
      await prisma.userProfile
        .updateMany({
          where: { id: user.id, avatarUrl: null },
          data: { avatarUrl: info.picture },
        })
        .catch(() => {});
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    // MUHIM: sessiya VA state cookie'larni BITTA API (res.cookies) orqali qo'yamiz.
    // headers.append('Set-Cookie',...) + res.cookies.set() ni aralashtirsak,
    // Next serializatsiyada qo'lda qo'shilgan sessiya cookie'sini o'chirib yuboradi
    // → foydalanuvchi login bo'lmaydi (landing'ga qaytadi).
    const useSecure = (process.env.NEXT_PUBLIC_APP_URL || '').startsWith('https://');
    const res = NextResponse.redirect(appUrl('/'));
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: useSecure,
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 kun (createSessionCookie bilan bir xil)
    });
    res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 }); // state tozalash
    return res;
  } catch (err) {
    console.error('[auth/callback google]', err);
    return loginError('oauth_failed');
  }
}
