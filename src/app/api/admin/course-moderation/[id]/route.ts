/**
 * PATCH /api/admin/course-moderation/[id]
 * Admin kursni tasdiqlaydi/rad etadi/qayta ishlashga qaytaradi.
 * Body: { action: 'approve' | 'reject' | 'request_revision', feedback?: string }
 *
 * Barchasi YAGONA state-machine servisidan (course-moderation.service.applyAction) o'tadi:
 *  - o'tish qoidalari (masalan draft'ni to'g'ridan approve qilib bo'lmaydi -> 400),
 *  - idempotentlik, audit log, va o'qituvchiga EMAIL bilan bildirishnoma.
 * Ilgari bu route prisma'ga to'g'ridan-to'g'ri yozib, qoidalarni chetlab o'tar va faqat
 * in-app notification yuborardi (email yo'q).
 */
import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import { applyAction, type CourseActionPayload } from '@/lib/services/course-moderation.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const action = String(body.action || '');
    const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : undefined;

    if (!['approve', 'reject', 'request_revision'].includes(action)) {
      throw new ValidationError("action: approve | reject | request_revision");
    }

    let payload: CourseActionPayload;
    if (action === 'approve') {
      payload = { action: 'approve', feedback };
    } else if (action === 'reject') {
      payload = { action: 'reject', feedback: feedback ?? '' };
    } else {
      payload = { action: 'request_revision', feedback: feedback ?? '' };
    }

    // Servis feedback'ni ham tekshiradi (reject/revision -> kamida 5 belgi).
    const course = await applyAction(session.sub, id, payload, req);
    return jsonResponse({ course });
  } catch (err) {
    return errorResponse(err);
  }
}
