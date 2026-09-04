/**
 * DELETE /api/admin/subscriptions/[id]
 * Admin obunani bekor qiladi (status='cancelled'). Foydalanuvchi darhol obuna
 * imkoniyatlaridan mahrum bo'ladi (hasActiveSubscription faqat status='active' + muddat).
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { cancelSubscription } from '@/lib/services/subscription.service';
import { auditLogRepo } from '@/lib/repositories';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;

    const sub = await prisma.subscription.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });
    if (!sub) throw new ValidationError('Obuna topilmadi');

    await cancelSubscription(id);

    await auditLogRepo.create({
      adminId: admin.sub,
      action: 'subscription.cancel',
      targetType: 'user',
      targetId: sub.userId,
      metadata: { subscriptionId: id },
    });

    return jsonResponse({ ok: true });
  } catch (err) { return errorResponse(err); }
}
