/**
 * PATCH /api/admin/subscription-requests/[id]
 * Admin so'rovni tasdiqlaydi yoki rad etadi. Body: { action: 'approve' | 'reject' }
 * approve → obuna faollashadi (grantSubscriptionManually).
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import {
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
} from '@/lib/services/subscription.service';
import { auditLogRepo } from '@/lib/repositories';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action;

    if (action === 'approve') {
      const result = await approveSubscriptionRequest(id, admin.sub);
      await auditLogRepo.create({
        adminId: admin.sub,
        action: 'subscription.request_approve',
        targetType: 'user',
        targetId: result.userId,
        metadata: { requestId: id, expiresAt: result.expiresAt.toISOString() },
      });
      return jsonResponse({ ok: true, expiresAt: result.expiresAt });
    }
    if (action === 'reject') {
      await rejectSubscriptionRequest(id, admin.sub);
      await auditLogRepo.create({
        adminId: admin.sub,
        action: 'subscription.request_reject',
        targetType: 'subscription_request',
        targetId: id,
      });
      return jsonResponse({ ok: true });
    }
    throw new ValidationError("action 'approve' yoki 'reject' bo'lishi kerak");
  } catch (err) {
    return errorResponse(err);
  }
}
