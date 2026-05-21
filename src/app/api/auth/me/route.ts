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

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

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
