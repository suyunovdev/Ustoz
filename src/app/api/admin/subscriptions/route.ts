/**
 * GET  — faol obunalar ro'yxati (admin).
 * POST — admin QO'LDA obuna beradi (Payme/Click integratsiyasiz).
 *        Body: { email? , userId?, planId } — email yoki userId majburiy.
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { grantSubscriptionManually } from '@/lib/services/subscription.service';
import { auditLogRepo } from '@/lib/repositories';

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

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
    const userIdRaw = typeof body.userId === 'string' ? body.userId.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!planId) throw new ValidationError('planId majburiy');
    if (!userIdRaw && !email) throw new ValidationError('email yoki userId majburiy');

    // Foydalanuvchini topish (userId ustuvor, aks holda email bo'yicha)
    const target = await prisma.userProfile.findFirst({
      where: userIdRaw ? { id: userIdRaw } : { email },
      select: { id: true, email: true, fullName: true, deletedAt: true, isActive: true },
    });
    if (!target) throw new ValidationError('Foydalanuvchi topilmadi');
    if (target.deletedAt || !target.isActive) throw new ValidationError('Foydalanuvchi faol emas');

    const result = await grantSubscriptionManually(target.id, planId);

    await auditLogRepo.create({
      adminId: admin.sub,
      action: 'subscription.grant_manual',
      targetType: 'user',
      targetId: target.id,
      metadata: { planId, expiresAt: result.expiresAt.toISOString(), email: target.email },
    });

    return jsonResponse(
      {
        subscription: {
          id: result.id,
          userEmail: target.email,
          userName: target.fullName,
          expiresAt: result.expiresAt,
        },
      },
      { status: 201 },
    );
  } catch (err) { return errorResponse(err); }
}
