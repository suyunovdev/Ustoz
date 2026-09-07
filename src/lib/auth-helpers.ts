/**
 * Auth helpers — route handler'larda takrorlanadigan boilerplate'ni qisqartirish.
 *
 * Foydalanish:
 *   const session = await requireAdmin(req);  // throws → catch'da HTTP status
 */

import type { NextRequest } from 'next/server';
import { getSession, getSessionFromRequest, type JWTPayload } from './auth';
import { ForbiddenError, UnauthorizedError, isServiceError } from './errors';
import { jsonResponse } from './json';
import { prisma } from './prisma';
import { isSessionValid } from './services/session.service';

/**
 * JWT dekod qilingandan so'ng sessiya DB holatini tekshiradi:
 *   - foydalanuvchi mavjud emas         → 'unauthorized' (o'chirilgan akkaunt)
 *   - profil suspended / deletedAt      → 'forbidden'
 *   - token.tokenVersion != DB.version  → 'unauthorized' (parol o'zgargan / suspend)
 * requireAuth (throws) va getVerifiedSession (null qaytaradi) shu mantiqni bo'lishadi —
 * shu tariqa JWT-only tekshiruv (getSession/middleware) bilan DB-backed tekshiruv
 * o'rtasidagi nomuvofiqlik (redirect sikli) yo'qoladi.
 */
async function validateSessionInDb(
  session: JWTPayload,
): Promise<'ok' | 'unauthorized' | 'forbidden'> {
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      tokenVersion: true,
      profile: { select: { isActive: true, deletedAt: true } },
    },
  });

  if (!user) return 'unauthorized';
  if (user.profile && (user.profile.isActive === false || user.profile.deletedAt !== null)) {
    return 'forbidden';
  }
  // Eski (tokenVersion'siz) tokenlar ?? 0 — mavjud foydalanuvchilar default 0, mos keladi.
  if ((session.tokenVersion ?? 0) !== user.tokenVersion) return 'unauthorized';
  return 'ok';
}

/**
 * Cookie'dagi sessiyani JWT + DB darajasida to'liq tekshiradi (server component uchun).
 * Yaroqsiz (yo'q / muddati o'tgan / tokenVersion eskirgan / bloklangan) → null.
 *
 * getSession() faqat imzoni tekshiradi; getVerifiedSession() esa requireAuth bilan
 * BIR XIL DB tekshiruvini qo'llaydi. Redirect qaror qabul qiluvchi sahifalar
 * (masalan `/`) buni ishlatishi kerak — aks holda eskirgan cookie dashboard'ga
 * redirect qilib, API 401 → login sikli hosil bo'ladi.
 */
export async function getVerifiedSession(): Promise<JWTPayload | null> {
  const session = await getSession();
  if (!session) return null;
  const status = await validateSessionInDb(session);
  if (status !== 'ok') return null;
  // requireAuth bilan IZCHIL: bekor qilingan qurilma sessiyasi (jti) ham null.
  // Aks holda `/` dashboard'ga redirect qiladi, API'lar requireAuth orqali 401
  // beradi va client /login'ga qaytadi — aynan oldini olinmoqchi bo'lgan sikl.
  // Legacy (jti'siz) tokenlar bu tekshiruvdan mustasno (requireAuth bilan bir xil).
  if (session.jti && !(await isSessionValid(session.jti))) return null;
  return session;
}

/**
 * Authenticated foydalanuvchi sessiyasini qaytaradi.
 * Sessiya yo'q bo'lsa UnauthorizedError tashlaydi.
 *
 * JWT dekod qilingandan so'ng DB holati ham tekshiriladi (indekslangan PK lookup):
 *   - foydalanuvchi mavjud emas         → 401 (o'chirilgan akkaunt)
 *   - profil suspended (isActive=false) yoki deletedAt → 403
 *   - token.tokenVersion != DB.tokenVersion → 401 (parol o'zgargan / suspend → eski token bekor)
 * Shu tariqa suspend/parol o'zgarishi eski JWT'larni DARHOL kuchsizlantiradi
 * (7 kunlik token muddatini kutmasdan).
 */
export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const session = await getSessionFromRequest(req);
  if (!session) throw new UnauthorizedError();

  const status = await validateSessionInDb(session);
  if (status === 'forbidden') throw new ForbiddenError('Akkaunt bloklangan');
  if (status !== 'ok') throw new UnauthorizedError();

  // Sessiya (qurilma) tekshiruvi — token jti bo'lsa, tegishli UserSession yaroqli
  // bo'lishi shart (bekor qilingan qurilma darhol 401 oladi). Legacy (jti'siz)
  // tokenlar bu tekshiruvdan mustasno — deploy'da mavjud sessiyalar buzilmaydi.
  if (session.jti && !(await isSessionValid(session.jti))) {
    throw new UnauthorizedError();
  }

  return session;
}

/**
 * Faqat admin uchun. Boshqa rollar → ForbiddenError.
 */
export async function requireAdmin(req: NextRequest): Promise<JWTPayload> {
  const session = await requireAuth(req);
  if (session.role !== 'admin') {
    throw new ForbiddenError('Faqat administratorlar uchun');
  }
  return session;
}

/**
 * Teacher yoki admin uchun.
 */
export async function requireTeacherOrAdmin(req: NextRequest): Promise<JWTPayload> {
  const session = await requireAuth(req);
  if (session.role !== 'teacher' && session.role !== 'admin') {
    throw new ForbiddenError('Faqat oʻqituvchi yoki administrator uchun');
  }
  return session;
}

/**
 * Faqat student rolidagi foydalanuvchilar uchun.
 * Talabaga oid endpoint'lar: enrollment, progress, sertifikat, tavsiyalar.
 * Teacher/Admin bu endpoint'larga kira olmasligi kerak —
 * agar ular o'rganmoqchi bo'lsa, alohida student account ochsin.
 */
export async function requireStudent(req: NextRequest): Promise<JWTPayload> {
  const session = await requireAuth(req);
  if (session.role !== 'student') {
    throw new ForbiddenError('Faqat talabalar uchun');
  }
  return session;
}

/**
 * Request'dan IP olish (Vercel/proxy uchun forwarded header'ni hurmat qiladi).
 */
export function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || null;
}

export function getUserAgent(req: NextRequest): string | null {
  return req.headers.get('user-agent') || null;
}

/**
 * Service-level error'lardan HTTP javob yasaydi. Route handler'larda:
 *
 *   try {
 *     const session = await requireAdmin(req);
 *     // ...
 *   } catch (err) {
 *     return errorResponse(err);
 *   }
 */
export function errorResponse(err: unknown) {
  if (isServiceError(err)) {
    const status = mapErrorCodeToStatus(err.code);
    return jsonResponse({ error: err.message, code: err.code }, { status });
  }
  // eslint-disable-next-line no-console
  console.error('[errorResponse] unhandled', err);
  return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
}

function mapErrorCodeToStatus(code: string): number {
  switch (code) {
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
    case 'SELF_ACTION_NOT_ALLOWED':
    case 'LAST_ADMIN_PROTECTED':
    case 'NOT_ENROLLED':
    case 'TEST_NOT_PUBLISHED':
      return 403;
    case 'USER_NOT_FOUND':
    case 'ENROLLMENT_NOT_FOUND':
    case 'TOPIC_NOT_FOUND':
    case 'COURSE_NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
    case 'INVALID_STATUS_TRANSITION':
      return 400;
    case 'CONFLICT':
      return 409;
    default:
      return 500;
  }
}
