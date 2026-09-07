import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, createSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { attributeOnSignup } from '@/lib/services/referral.service';
import { createSession } from '@/lib/services/session.service';
import { isEmail, validatePassword } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, fullName, password, role = 'student' } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email va OTP majburiy' }, { status: 400 });
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Email formati noto\'g\'ri' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(String(otp))) {
      return NextResponse.json({ error: 'OTP 6 raqamdan iborat bo\'lishi kerak' }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const otpRecord = await prisma.otpCode.findUnique({
      where: { email: normalizedEmail },
    });

    if (!otpRecord || otpRecord.verified) {
      return NextResponse.json(
        { error: 'OTP topilmadi yoki allaqachon ishlatilgan' },
        { status: 400 }
      );
    }

    if (otpRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'OTP muddati tugagan. Yangi kod so\'rang.' },
        { status: 400 }
      );
    }

    // Brute-force himoyasi: cheklangan urinishdan keyin kod bekor qilinadi.
    const MAX_OTP_ATTEMPTS = 5;
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      // Kodni bekor qilamiz — foydalanuvchi yangi kod so'rashi shart.
      await prisma.otpCode.delete({ where: { email: normalizedEmail } }).catch(() => {});
      return NextResponse.json(
        { error: 'Juda ko\'p noto\'g\'ri urinish. Yangi kod so\'rang.' },
        { status: 429 }
      );
    }

    // OTP DB'da hash sifatida saqlanadi — constant-time bcrypt solishtiruv.
    const otpMatches = await bcrypt.compare(String(otp), otpRecord.otp);
    if (!otpMatches) {
      await prisma.otpCode.update({
        where: { email: normalizedEmail },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: 'Noto\'g\'ri kod' }, { status: 400 });
    }

    // Signup holati — yangi user yaratish. Verified belgilash/OTP iste'mol qilinishi
    // FAQAT muvaffaqiyatli yaratishdan keyin (validatsiya yiqilsa kod yonmaydi).
    if (otpRecord.type === 'signup' && fullName && password) {
      // Privilegiya oshirishning oldini olish: rol faqat whitelist'dan
      // (aks holda body'dagi {"role":"admin"} orqali admin akkaunt yaratilardi)
      const validRoles = ['student', 'teacher'];
      if (!validRoles.includes(role)) {
        return NextResponse.json({ error: 'Noto\'g\'ri rol' }, { status: 400 });
      }

      // Yagona parol siyosati (register/reset bilan bir xil)
      const pwErr = validatePassword(password);
      if (pwErr) {
        return NextResponse.json({ error: pwErr }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return NextResponse.json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' }, { status: 409 });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: role as 'student' | 'teacher',
          profile: {
            create: {
              email: normalizedEmail,
              fullName,
              role: role as 'student' | 'teacher',
            },
          },
        },
        include: { profile: true },
      });

      // Referral attribution (cookie'da ref_code bo'lsa)
      const refCode = req.cookies.get('ref_code')?.value;
      if (refCode) {
        try {
          await attributeOnSignup(user.id, refCode);
        } catch {
          // silent — referral xato signup'ni buzmasin
        }
      }

      // OTP iste'mol qilindi — o'chiramiz (qayta ishlatib bo'lmaydi).
      await prisma.otpCode.delete({ where: { email: normalizedEmail } }).catch(() => {});

      const jti = await createSession(user.id, req);
      const token = await signToken({ sub: user.id, email: user.email, role: user.role, tokenVersion: user.tokenVersion, jti });
      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.profile?.fullName,
          role: user.role,
        },
      });
      response.headers.set('Set-Cookie', createSessionCookie(token));
      return response;
    }

    // Password reset yoki oddiy OTP tekshiruvi — verified deb belgilaymiz, lekin
    // tasdiqlangan oynaga QISQA muddat (10 daqiqa) beramiz: reset-password shu
    // muddat ichida bo'lishi shart (muddatsiz ochiq "reset eshigi" bo'lmaydi).
    await prisma.otpCode.update({
      where: { email: normalizedEmail },
      data: { verified: true, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/verify-otp]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
