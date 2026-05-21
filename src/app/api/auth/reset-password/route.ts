import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email va yangi parol majburiy' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // OTP tasdiqlangan bo'lishini tekshirish
    const otpRecord = await prisma.otpCode.findUnique({
      where: { email: normalizedEmail },
    });

    if (!otpRecord || otpRecord.type !== 'password_reset' || !otpRecord.verified) {
      return NextResponse.json(
        { error: 'Avval OTP kodni tasdiqlang' },
        { status: 400 }
      );
    }

    // Foydalanuvchini topish va parolni yangilash
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    // OTP yozuvini o'chirish
    await prisma.otpCode.delete({ where: { email: normalizedEmail } });

    return NextResponse.json({ success: true, message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
