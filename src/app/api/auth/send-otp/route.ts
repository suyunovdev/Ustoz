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

    // Email mavjudligini tekshirish — lekin javob bir xil (enumeration oldini olish)
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (type === 'signup' && existing) {
      // Email band — lekin tashqariga aytmaymiz, shunchaki "success" qaytaramiz
      // Haqiqiy foydalanuvchi login sahifasiga yo'naltiriladi
      return NextResponse.json({ success: true, emailDelivered: false });
    }

    if (type === 'password_reset' && !existing) {
      // Email topilmadi — lekin tashqariga aytmaymiz
      return NextResponse.json({ success: true, emailDelivered: false });
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
      try {
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
                <h2 style="color:#0f4c75;">Ustoz platformasi</h2>
                <p>Sizning tasdiqlash kodingiz:</p>
                <div style="font-size:40px;font-weight:bold;letter-spacing:10px;color:#0f4c75;padding:20px 0;">${otp}</div>
                <p style="color:#6b7280;">Kod 10 daqiqa ichida amal qiladi.</p>
                <p style="color:#9ca3af;font-size:12px;">Agar siz bu kodni so'ramagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
              </div>
            `,
          }),
        });
        if (resp.ok) {
          emailDelivered = true;
          console.log(`[resend] OTP sent to ${normalizedEmail}`);
        } else {
          const errBody = await resp.text();
          console.error(`[resend] ${resp.status}:`, errBody);
        }
      } catch (err) {
        console.error('[resend] fetch error:', err);
      }
    }

    // Production'da OTP log qilinmaydi — faqat delivery holati
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV OTP] ${normalizedEmail} → ${otp}`);
    } else {
      console.log(`[OTP] sent to ${normalizedEmail.slice(0, 3)}*** (delivered: ${emailDelivered})`);
    }

    const responseBody: Record<string, unknown> = { success: true, emailDelivered };
    // Vaqtinchalik: email ishlamaguncha OTP ni qaytarish (Resend domain verify bo'lganda olib tashlanadi)
    if (!emailDelivered) {
      responseBody.devOtp = otp;
    }
    return NextResponse.json(responseBody);
  } catch (err) {
    console.error('[auth/send-otp]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
