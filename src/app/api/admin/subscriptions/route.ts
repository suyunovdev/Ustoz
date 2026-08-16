/** GET — faol obunalar ro'yxati (admin). */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const statusRaw = req.nextUrl.searchParams.get('status') ?? 'active';
    const where = statusRaw === 'all' ? {} : { status: statusRaw };
    const rows = await prisma.subscription.findMany({
      where, orderBy: { createdAt: 'desc' }, take: 100,
      include: { user: { select: { fullName: true, email: true } }, plan: { select: { name: true } } },
    });
    const subscriptions = rows.map((s) => ({
      id: s.id, userName: s.user?.fullName ?? '—', userEmail: s.user?.email ?? '',
      planName: s.plan?.name ?? '—', status: s.status,
      startedAt: s.startedAt, expiresAt: s.expiresAt,
    }));
    return jsonResponse({ subscriptions });
  } catch (err) { return errorResponse(err); }
}
