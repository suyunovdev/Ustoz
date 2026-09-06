import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { isEmail, validatePassword } from '@/lib/validation';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Email va yangi parol majburiy' }, { status: 400 });
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Email formati noto\'g\'ri' }, { status: 400 });
    }

    // Yagona parol siyosati (register/OTP-signup bilan bir xil)
    const pwErr = validatePassword(newPassword);
    if (pwErr) {
      return NextResponse.json({ error: pwErr }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Rate limit — reset abuse'ni cheklaymiz (IP + email bo'yicha).
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const rl = await checkRateLimit(`reset:${ip}:${normalizedEmail}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Juda ko\'p urinish. 15 daqiqadan keyin urinib ko\'ring.' },
        { status: 429, headers: { 'Retry-After': '900' } },
      );
    }

    // OTP tasdiqlangan VA hali muddati o'tmagan bo'lishi shart (tasdiqlangan oyna
    // 10 daqiqa — verify-otp'da o'rnatiladi). Muddatsiz "reset eshigi" bo'lmaydi.
    const otpRecord = await prisma.otpCode.findUnique({
      where: { email: normalizedEmail },
    });

    if (
      !otpRecord ||
      otpRecord.type !== 'password_reset' ||
      !otpRecord.verified ||
      otpRecord.expiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: 'Avval OTP kodni tasdiqlang (yoki muddati tugagan — qaytadan boshlang)' },
        { status: 400 }
      );
    }

    // Foydalanuvchini topish va parolni yangilash
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    // tokenVersion inkrementi — eski JWT sessiyalar DARHOL bekor bo'ladi (akkaunt
    // o'g'irlangan bo'lsa, hujumchining tokeni ishlamay qoladi).
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });

    // OTP yozuvini o'chirish
    await prisma.otpCode.delete({ where: { email: normalizedEmail } });

    return NextResponse.json({ success: true, message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (err) {
    console.error('[auth/reset-password]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
