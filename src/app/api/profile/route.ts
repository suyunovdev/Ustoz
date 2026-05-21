import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/profile
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({ where: { id: session.sub } });
  if (!profile) return NextResponse.json({ error: 'Profil topilmadi' }, { status: 404 });

  return NextResponse.json({ profile });
}

// PATCH /api/profile
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const { fullName, avatarUrl, bio } = await req.json();

  const profile = await prisma.userProfile.update({
    where: { id: session.sub },
    data: {
      ...(fullName && { fullName }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(bio !== undefined && { bio }),
    },
  });

  return NextResponse.json({ profile });
}
