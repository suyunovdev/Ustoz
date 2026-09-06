/**
 * PATCH /api/admin/course-purchase-requests/[id]
 * Admin so'rovni tasdiqlaydi yoki rad etadi. Body: { action: 'approve' | 'reject' }
 * approve → talaba kursga yoziladi (approveCoursePurchaseRequest).
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import {
  approveCoursePurchaseRequest,
  rejectCoursePurchaseRequest,
} from '@/lib/services/course-purchase.service';
import { auditLogRepo } from '@/lib/repositories';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin(req);
    const { id } = await params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const action = body.action;

    if (action === 'approve') {
      const result = await approveCoursePurchaseRequest(id, admin.sub);
      await auditLogRepo.create({
        adminId: admin.sub,
        action: 'course.purchase_approve',
        targetType: 'user',
        targetId: result.userId,
        metadata: { requestId: id, courseId: result.courseId },
      });
      return jsonResponse({ ok: true });
    }
    if (action === 'reject') {
      await rejectCoursePurchaseRequest(id, admin.sub);
      await auditLogRepo.create({
        adminId: admin.sub,
        action: 'course.purchase_reject',
        targetType: 'course_purchase_request',
        targetId: id,
      });
      return jsonResponse({ ok: true });
    }
    throw new ValidationError("action 'approve' yoki 'reject' bo'lishi kerak");
  } catch (err) {
    return errorResponse(err);
  }
}
