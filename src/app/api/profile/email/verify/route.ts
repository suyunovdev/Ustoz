/**
 * POST /api/profile/email/verify — OTP tasdig'i bilan emailni o'zgartiradi.
 * Muvaffaqiyatda: user.email + profile.email yangilanadi, tokenVersion++ (barcha eski
 * sessiyalar bekor) — foydalanuvchi qayta kirishi kerak.
 */
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { isEmail, normalizeEmail } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (!isEmail(body.newEmail) || !/^\d{6}$/.test(String(body.otp ?? ''))) {
      return jsonResponse({ error: "Email yoki kod noto'g'ri" }, { status: 400 });
    }
    const newEmail = normalizeEmail(String(body.newEmail));
    const otp = String(body.otp);

    const rec = await prisma.otpCode.findUnique({ where: { email: newEmail } });
    if (!rec || rec.type !== 'email_change' || rec.expiresAt < new Date()) {
      return jsonResponse({ error: 'Kod topilmadi yoki muddati tugagan' }, { status: 400 });
    }
    if (rec.attempts >= 5) {
      await prisma.otpCode.delete({ where: { email: newEmail } }).catch(() => {});
      return jsonResponse({ error: 'Juda ko\'p urinish. Qaytadan boshlang.' }, { status: 429 });
    }
    const ok = await bcrypt.compare(otp, rec.otp);
    if (!ok) {
      await prisma.otpCode.update({ where: { email: newEmail }, data: { attempts: { increment: 1 } } });
      return jsonResponse({ error: "Noto'g'ri kod" }, { status: 400 });
    }

    // Band emasligini yana tekshiramiz (poyga oynasi)
    const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
    if (taken && taken.id !== session.sub) {
      return jsonResponse({ error: 'Bu email band' }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.sub },
        data: { email: newEmail, tokenVersion: { increment: 1 } },
      }),
      prisma.userProfile.update({ where: { id: session.sub }, data: { email: newEmail } }),
      prisma.otpCode.delete({ where: { email: newEmail } }),
    ]);

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
