import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, createSessionCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

// Brute force: har (ip+email) uchun 5 muvaffaqiyatsiz urinish / 15 daqiqa.
// Upstash Redis (mavjud bo'lsa) yoki in-memory fallback — serverless/cluster'da barqaror.
const LOGIN_MAX = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Timing attack oldini olish uchun dummy hash
const DUMMY_HASH = '$2a$12$LJ3m4ys3bGDZBOJfxvzuVuQGqDz5x3Xz3y5RGj5XJ5qZ3qZ3qZ3q';

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'JSON formatida yuborilishi kerak' }, { status: 400 });
    }
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol majburiy' },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `login:${ip}:${normalizedEmail}`;

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    // Timing attack himoyasi: user topilmasa ham bcrypt.compare chaqiriladi
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const isValid = await bcrypt.compare(String(password), hashToCompare);

    if (!user || !isValid) {
      // FAQAT muvaffaqiyatsiz urinishlar hisoblanadi (muvaffaqiyatli login limitga
      // tegmaydi). Redis (mavjud bo'lsa) yoki in-memory fallback — serverless/cluster
      // bo'ylab barqaror. Limitdan oshsa 429.
      const rl = await checkRateLimit(rateLimitKey, LOGIN_MAX, LOGIN_WINDOW_MS);
      if (!rl.allowed) {
        const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
        return NextResponse.json(
          { error: `Juda ko'p urinish. ${retryAfter} sekunddan keyin qayta urinib ko'ring.` },
          { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
      }
      return NextResponse.json(
        { error: 'Email yoki parol noto\'g\'ri' },
        { status: 401 },
      );
    }

    // Bloklangan (suspended) yoki o'chirilgan akkaunt kira olmaydi —
    // aks holda suspend qilingan foydalanuvchi yangi 7 kunlik token olardi.
    if (user.profile && (user.profile.isActive === false || user.profile.deletedAt !== null)) {
      return NextResponse.json(
        { error: 'Akkaunt bloklangan. Administrator bilan bog\'laning.' },
        { status: 403 },
      );
    }

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.profile?.fullName,
        role: user.role,
        avatarUrl: user.profile?.avatarUrl,
      },
    });

    response.headers.set('Set-Cookie', createSessionCookie(token));
    return response;
  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
