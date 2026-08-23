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
import { signToken, createSessionCookie } from '@/lib/auth';
import { normalizeEmail } from '@/lib/validation';
import {
  isGoogleOAuthConfigured,
  exchangeCodeForToken,
  fetchGoogleUserInfo,
} from '@/lib/oauth/google';
import { OAUTH_STATE_COOKIE } from '@/app/api/auth/google/route';

function loginError(req: NextRequest, code: string): NextResponse {
  const res = NextResponse.redirect(new URL(`/login?error=${code}`, req.url));
  // state cookie'ni tozalaymiz
  res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 });
  return res;
}

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(new URL('/login?error=oauth_not_configured', req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const oauthError = searchParams.get('error'); // foydalanuvchi rad etsa (access_denied)

  if (oauthError) return loginError(req, 'oauth_cancelled');
  if (!code || !state) return loginError(req, 'oauth_failed');

  // CSRF: state cookie bilan moslik
  const savedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!savedState || savedState !== state) return loginError(req, 'oauth_state');

  try {
    const accessToken = await exchangeCodeForToken(code);
    const info = await fetchGoogleUserInfo(accessToken);

    if (!info.email || !info.emailVerified) {
      return loginError(req, 'oauth_email_unverified');
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

    const res = NextResponse.redirect(new URL('/', req.url));
    res.headers.append('Set-Cookie', createSessionCookie(token));
    res.cookies.set(OAUTH_STATE_COOKIE, '', { path: '/', maxAge: 0 }); // state tozalash
    return res;
  } catch (err) {
    console.error('[auth/callback google]', err);
    return loginError(req, 'oauth_failed');
  }
}
