import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const limit = Number(req.nextUrl.searchParams.get('limit') || '20');
  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: session.sub,
      ...(unreadOnly ? { status: 'unread' } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 50),
  });

  const unreadCount = await prisma.notification.count({
    where: { recipientId: session.sub, status: 'unread' },
  });

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH /api/notifications — O'qilgan deb belgilash
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const { ids, markAll } = await req.json();

  if (markAll) {
    await prisma.notification.updateMany({
      where: { recipientId: session.sub, status: 'unread' },
      data: { status: 'read', readAt: new Date() },
    });
  } else if (ids?.length) {
    await prisma.notification.updateMany({
      where: { id: { in: ids }, recipientId: session.sub },
      data: { status: 'read', readAt: new Date() },
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/notifications?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID talab qilinadi' }, { status: 400 });

  await prisma.notification.deleteMany({ where: { id, recipientId: session.sub } });
  return NextResponse.json({ success: true });
}
