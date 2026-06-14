import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, createSessionCookie } from '@/lib/auth';

// Brute force himoyasi (in-memory, production'da Redis ishlatiladi)
const loginAttempts = new Map<string, { count: number; blockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 daqiqa

// Timing attack oldini olish uchun dummy hash
const DUMMY_HASH = '$2a$12$LJ3m4ys3bGDZBOJfxvzuVuQGqDz5x3Xz3y5RGj5XJ5qZ3qZ3qZ3q';

function checkLoginRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (entry && entry.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) };
  }

  if (entry && entry.blockedUntil <= now) {
    loginAttempts.delete(key);
  }

  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const entry = loginAttempts.get(key) || { count: 0, blockedUntil: 0 };
  entry.count++;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.blockedUntil = Date.now() + BLOCK_DURATION;
    entry.count = 0;
  }
  loginAttempts.set(key, entry);
}

function clearAttempts(key: string): void {
  loginAttempts.delete(key);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol majburiy' },
        { status: 400 },
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const rateLimitKey = `login:${ip}:${normalizedEmail}`;

    // Brute force tekshiruvi
    const { allowed, retryAfter } = checkLoginRateLimit(rateLimitKey);
    if (!allowed) {
      return NextResponse.json(
        { error: `Juda ko'p urinish. ${retryAfter} sekunddan keyin qayta urinib ko'ring.` },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    // Timing attack himoyasi: user topilmasa ham bcrypt.compare chaqiriladi
    const hashToCompare = user?.passwordHash || DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { error: 'Email yoki parol noto\'g\'ri' },
        { status: 401 },
      );
    }

    // Muvaffaqiyatli login — urinishlar tozalanadi
    clearAttempts(rateLimitKey);

    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
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
