import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Kriptografik xavfsiz OTP
function generateOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, '0');
}

// Rate limiting (in-memory, production da Redis ishlatiladi)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, max = 5, windowMs = 15 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const { email, type = 'signup' } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return NextResponse.json({ error: 'Email formati noto\'g\'ri' }, { status: 400 });
    }

    const validTypes = ['signup', 'password_reset'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Noto\'g\'ri so\'rov turi' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const normalizedEmail = String(email).toLowerCase().trim();
    const key = `otp:${ip}:${normalizedEmail}`;

    if (!checkRateLimit(key)) {
      return NextResponse.json(
        { error: 'Juda ko\'p so\'rov. 15 daqiqadan keyin urinib ko\'ring.' },
        { status: 429, headers: { 'Retry-After': '900' } }
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa

    await prisma.otpCode.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, otp, type, expiresAt },
      update: { otp, type, expiresAt, verified: false },
    });

    // Email yuborish
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && !resendKey.startsWith('your-')) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Ustoz <noreply@ustoz.uz>',
          to: [normalizedEmail],
          subject: `Ustoz — Tasdiqlash kodi: ${otp}`,
          html: `
            <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px;">
              <h2 style="color:#7c3aed;">Ustoz platformasi</h2>
              <p>Sizning tasdiqlash kodingiz:</p>
              <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#7c3aed;padding:20px 0;">${otp}</div>
              <p style="color:#6b7280;">Kod 10 daqiqa ichida amal qiladi.</p>
            </div>
          `,
        }),
      });
    } else {
      // Development rejimi: consolega chiqar
      console.log(`[DEV OTP] ${normalizedEmail} → ${otp}`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[auth/send-otp]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
