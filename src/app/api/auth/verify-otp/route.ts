import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, createSessionCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, fullName, password, role = 'student' } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email va OTP majburiy' }, { status: 400 });
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

    if (otpRecord.otp !== String(otp)) {
      return NextResponse.json({ error: 'Noto\'g\'ri kod' }, { status: 400 });
    }

    // OTP ni verified deb belgilash
    await prisma.otpCode.update({
      where: { email: normalizedEmail },
      data: { verified: true },
    });

    // Signup holati — yangi user yaratish
    if (otpRecord.type === 'signup' && fullName && password) {
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

      const token = await signToken({ sub: user.id, email: user.email, role: user.role });
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

    // Password reset yoki oddiy OTP tekshiruvi
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/verify-otp]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
