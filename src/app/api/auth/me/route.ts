import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { profile: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Foydalanuvchi topilmadi' }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.profile?.fullName,
      role: user.role,
      avatarUrl: user.profile?.avatarUrl,
      bio: user.profile?.bio,
    },
  });
}

// PATCH /api/auth/me
// UserProfile.id = User.id (shared PK) — shu sababli where: { id: session.sub } to'g'ri.
// Faqat fullName, avatarUrl, bio yangilanadi; role/email/payout kabi maydonlar
// alohida endpoint'lar orqali (admin yoki maxsus flow) o'zgartiriladi.
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON formatida xato" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  // Input validatsiyasi va sanitizatsiya
  const data: { fullName?: string; avatarUrl?: string | null; bio?: string | null } = {};

  if (typeof b.fullName === 'string') {
    const v = b.fullName.trim();
    if (v.length < 2 || v.length > 100) {
      return NextResponse.json(
        { error: "Ism-familiya 2-100 belgi oralig'ida bo'lishi kerak" },
        { status: 400 },
      );
    }
    data.fullName = v;
  }

  if (b.avatarUrl !== undefined) {
    if (b.avatarUrl === null || b.avatarUrl === '') {
      data.avatarUrl = null;
    } else if (typeof b.avatarUrl === 'string') {
      const v = b.avatarUrl.trim();
      if (v.length > 2048) {
        return NextResponse.json({ error: 'Avatar URL juda uzun' }, { status: 400 });
      }
      // Faqat http(s) URL'lar yoki data:image/...
      if (!/^(https?:\/\/|data:image\/)/i.test(v)) {
        return NextResponse.json({ error: "Avatar URL noto'g'ri formatda" }, { status: 400 });
      }
      data.avatarUrl = v;
    } else {
      return NextResponse.json({ error: "avatarUrl matn bo'lishi kerak" }, { status: 400 });
    }
  }

  if (b.bio !== undefined) {
    if (b.bio === null || b.bio === '') {
      data.bio = null;
    } else if (typeof b.bio === 'string') {
      const v = b.bio.trim();
      if (v.length > 1000) {
        return NextResponse.json({ error: 'Bio 1000 belgidan oshmasligi kerak' }, { status: 400 });
      }
      data.bio = v;
    } else {
      return NextResponse.json({ error: "bio matn bo'lishi kerak" }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Yangilash uchun maydon yo'q" }, { status: 400 });
  }

  const profile = await prisma.userProfile.update({
    where: { id: session.sub },
    data,
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
      bio: true,
      role: true,
    },
  });

  return NextResponse.json({ profile });
}
