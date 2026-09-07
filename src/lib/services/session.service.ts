/**
 * Sessiya (qurilma) xizmati — faol qurilmalar ro'yxati va bekor qilish.
 * JWT'dagi `jti` (UserSession.tokenId) orqali bog'lanadi.
 */
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // JWT bilan bir xil (7 kun)

function getIp(req: NextRequest): string | null {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || null;
}

/** User-agent'dan o'qish uchun qulay qurilma nomi (brauzer + OS). */
export function parseUserAgent(ua: string | null): string {
  if (!ua) return "Noma'lum qurilma";
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\//.test(ua) ? 'Opera'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari'
    : 'Brauzer';
  const os = /Windows/.test(ua) ? 'Windows'
    : /iPhone|iPad|iOS/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : '';
  return os ? `${browser} · ${os}` : browser;
}

/** Login paytida yangi sessiya yaratadi va jti qaytaradi. */
export async function createSession(userId: string, req: NextRequest): Promise<string> {
  const tokenId = crypto.randomUUID();
  await prisma.userSession.create({
    data: {
      userId,
      tokenId,
      userAgent: req.headers.get('user-agent')?.slice(0, 400) ?? null,
      ip: getIp(req),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return tokenId;
}

/** requireAuth uchun: jti bo'yicha sessiya yaroqli (mavjud, bekor emas, muddati o'tmagan)? */
export async function isSessionValid(tokenId: string): Promise<boolean> {
  const s = await prisma.userSession.findUnique({
    where: { tokenId },
    select: { revokedAt: true, expiresAt: true },
  });
  if (!s) return false;
  return s.revokedAt === null && s.expiresAt > new Date();
}

/** Foydalanuvchining faol qurilmalari (joriysi belgilangan). */
export async function listUserSessions(userId: string, currentJti?: string) {
  const rows = await prisma.userSession.findMany({
    where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, tokenId: true, userAgent: true, ip: true, createdAt: true },
  });
  return rows.map((r) => ({
    id: r.id,
    device: parseUserAgent(r.userAgent),
    ip: r.ip,
    createdAt: r.createdAt,
    current: !!currentJti && r.tokenId === currentJti,
  }));
}

/** Bitta qurilmani chiqarish (faqat o'ziniki). */
export async function revokeSession(userId: string, sessionId: string): Promise<boolean> {
  const res = await prisma.userSession.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return res.count > 0;
}

/** Barcha qurilmalarni bekor qilish. */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
