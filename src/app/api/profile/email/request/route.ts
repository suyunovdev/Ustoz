/**
 * POST /api/profile/email/request — joriy foydalanuvchi email'ini o'zgartirish uchun
 * YANGI emailga OTP yuboradi. Authed (session.sub bilan bog'langan).
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { isEmail, normalizeEmail } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';

function generateOtp(): string {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return String(a[0] % 1000000).padStart(6, '0');
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (!isEmail(body.newEmail)) {
      return jsonResponse({ error: "Email formati noto'g'ri" }, { status: 400 });
    }
    const newEmail = normalizeEmail(String(body.newEmail));

    // Joriy foydalanuvchi
    const me = await prisma.user.findUnique({ where: { id: session.sub }, select: { email: true } });
    if (!me) return jsonResponse({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    if (me.email === newEmail) {
      return jsonResponse({ error: 'Bu allaqachon sizning emailingiz' }, { status: 400 });
    }
    // Boshqa foydalanuvchi bu emailni band qilganmi
    const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } });
    if (taken) {
      return jsonResponse({ error: 'Bu email band' }, { status: 409 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const rl = await checkRateLimit(`email-change:${session.sub}:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return jsonResponse({ error: 'Juda ko\'p urinish. 15 daqiqadan keyin urinib ko\'ring.' }, { status: 429 });
    }

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otpCode.upsert({
      where: { email: newEmail },
      create: { email: newEmail, otp: otpHash, type: 'email_change', expiresAt },
      update: { otp: otpHash, type: 'email_change', expiresAt, verified: false, attempts: 0 },
    });

    let emailDelivered = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const { sendOne } = await import('@/lib/email/resend-client');
        const r = await sendOne({
          to: newEmail,
          subject: 'Ustoz — email o\'zgartirish tasdig\'i',
          text: `Ustoz — email o'zgartirish. Tasdiqlash kodingiz: ${otp}\nKod 10 daqiqa amal qiladi.`,
          html: `<div style="font-family:sans-serif;max-width:460px;margin:0 auto;padding:24px;">
            <h2 style="color:#1F5EDC;margin:0 0 4px;">Ustoz</h2>
            <p style="color:#6b7280;margin:0 0 20px;">Email o'zgartirish</p>
            <p>Tasdiqlash kodingiz:</p>
            <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1F5EDC;background:#f1f5f9;border-radius:10px;text-align:center;padding:16px 0;margin:12px 0;">${otp}</div>
            <p style="color:#6b7280;font-size:14px;">Kod 10 daqiqa amal qiladi. Uni hech kimga bermang.</p>
          </div>`,
        });
        emailDelivered = r.success;
      } catch (e) {
        console.error('[email-change] resend:', e);
      }
    }

    const res: Record<string, unknown> = { success: true, emailDelivered };
    if (process.env.NODE_ENV !== 'production' && !emailDelivered) res.devOtp = otp;
    return NextResponse.json(res);
  } catch (err) {
    return errorResponse(err);
  }
}
