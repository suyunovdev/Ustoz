/**
 * PATCH  /api/admin/courses/[id] — admin kurs amali (approve/reject/request_revision/
 *        feature/unfeature/suspend/unsuspend). Barchasi YAGONA state-machine servisidan
 *        (course-moderation.service.applyAction) o'tadi: o'tish qoidalari + audit + email.
 * DELETE /api/admin/courses/[id] — force delete (egalik/obuna cheklovisiz).
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { adminDeleteCourse, ContentNotFoundError } from '@/lib/services/admin-content.service';
import { applyAction, type CourseActionPayload } from '@/lib/services/course-moderation.service';
import { ValidationError } from '@/lib/errors';

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

    const action = String(body.action ?? '');
    const feedback = typeof body.feedback === 'string' ? body.feedback : undefined;
    const reason = typeof body.reason === 'string' ? body.reason : '';

    let payload: CourseActionPayload;
    switch (action) {
      case 'approve':
        payload = { action: 'approve', feedback };
        break;
      case 'reject':
        payload = { action: 'reject', feedback: feedback ?? '' };
        break;
      case 'request_revision':
        payload = { action: 'request_revision', feedback: feedback ?? '' };
        break;
      case 'feature':
        payload = { action: 'feature' };
        break;
      case 'unfeature':
        payload = { action: 'unfeature' };
        break;
      case 'suspend':
        payload = { action: 'suspend', reason };
        break;
      case 'unsuspend':
        payload = { action: 'unsuspend' };
        break;
      default:
        throw new ValidationError(
          "action: approve | reject | request_revision | feature | unfeature | suspend | unsuspend",
        );
    }

    // State-machine servisi: o'tish qoidalari (noto'g'ri o'tish -> 400), audit log, email.
    const course = await applyAction(session.sub, id, payload, req);
    return jsonResponse({ course });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    await adminDeleteCourse(id);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof ContentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
