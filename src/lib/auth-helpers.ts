/**
 * Auth helpers — route handler'larda takrorlanadigan boilerplate'ni qisqartirish.
 *
 * Foydalanish:
 *   const session = await requireAdmin(req);  // throws → catch'da HTTP status
 */

import type { NextRequest } from 'next/server';
import { getSessionFromRequest, type JWTPayload } from './auth';
import { ForbiddenError, UnauthorizedError, isServiceError } from './errors';
import { jsonResponse } from './json';

/**
 * Authenticated foydalanuvchi sessiyasini qaytaradi.
 * Sessiya yo'q bo'lsa UnauthorizedError tashlaydi.
 */
export async function requireAuth(req: NextRequest): Promise<JWTPayload> {
  const session = await getSessionFromRequest(req);
  if (!session) throw new UnauthorizedError();
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
