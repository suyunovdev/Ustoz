import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken, createSessionCookie } from '@/lib/auth';
import { attributeOnSignup } from '@/lib/services/referral.service';

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, role = 'student' } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, parol va ism majburiy' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Parol kamida 8 ta belgidan iborat bo\'lishi kerak' },
        { status: 400 }
      );
    }

    const validRoles = ['student', 'teacher'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Noto\'g\'ri rol' }, { status: 400 });
    }

    // Email band ekanligini tekshirish
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'Bu email allaqachon ro\'yxatdan o\'tgan' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // User va UserProfile birga yaratish
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role as 'student' | 'teacher',
        profile: {
          create: {
            email,
            fullName,
            role: role as 'student' | 'teacher',
          },
        },
      },
      include: { profile: true },
    });

    // Referral attribution (agar cookie'da ref_code bo'lsa)
    const refCode = req.cookies.get('ref_code')?.value;
    if (refCode) {
      try {
        await attributeOnSignup(user.id, refCode);
      } catch {
        // silent — referral xato signup'ni buzmasin
      }
    }

    // Session token yaratish
    const token = await signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.profile?.fullName,
          role: user.role,
        },
      },
      { status: 201 }
    );

    response.headers.set('Set-Cookie', createSessionCookie(token));
    return response;
  } catch (err) {
    console.error('[auth/register]', err);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
