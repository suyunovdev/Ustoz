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

    // Signup uchun: email bandligini tekshirish
    if (type === 'signup') {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return NextResponse.json(
          { error: 'Bu email allaqachon ro\'yxatdan o\'tgan' },
          { status: 409 }
        );
      }
    }

    // Password reset uchun: email mavjudligini tekshirish
    if (type === 'password_reset') {
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!existing) {
        return NextResponse.json(
          { error: 'Bu email tizimda topilmadi' },
          { status: 404 }
        );
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 daqiqa

    await prisma.otpCode.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, otp, type, expiresAt },
      update: { otp, type, expiresAt, verified: false },
    });

    // Email yuborish
    const isDev = process.env.NODE_ENV !== 'production';
    const resendKey = process.env.RESEND_API_KEY;
    let emailDelivered = false;

    if (resendKey && !resendKey.startsWith('your-')) {
      const fromAddress = process.env.RESEND_FROM || 'Ustoz <onboarding@resend.dev>';
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: fromAddress,
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
      if (!resp.ok) {
        const errBody = await resp.text();
        console.error(`[resend] ${resp.status}:`, errBody);
        console.log(`[DEV OTP fallback] ${normalizedEmail} → ${otp}`);
      } else {
        emailDelivered = true;
        console.log(`[resend] OTP sent to ${normalizedEmail}`);
      }
    } else {
      console.log(`[DEV OTP] ${normalizedEmail} → ${otp}`);
    }

    // Dev rejimida OTP'ni response'da qaytaramiz (faqat development, prod'da NEVER)
    const responseBody: any = { success: true, emailDelivered };
    if (isDev) {
      responseBody.devOtp = otp;
    }
    return NextResponse.json(responseBody);
  } catch (err) {
    console.error('[auth/send-otp]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
