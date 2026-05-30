/**
 * PATCH /api/admin/courses/[id]
 *
 * Body (discriminated union):
 *   { action: 'approve',           feedback?: string }
 *   { action: 'reject',            feedback: string }
 *   { action: 'request_revision',  feedback: string }
 *   { action: 'feature' }
 *   { action: 'unfeature' }
 *   { action: 'suspend',           reason: string }
 *   { action: 'unsuspend' }
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  applyAction,
  type CourseActionPayload,
} from '@/lib/services/course-moderation.service';
import { ValidationError } from '@/lib/errors';

const VALID_ACTIONS = [
  'approve',
  'reject',
  'request_revision',
  'feature',
  'unfeature',
  'suspend',
  'unsuspend',
] as const;

function parseBody(body: unknown): CourseActionPayload {
  if (!body || typeof body !== 'object') {
    throw new ValidationError("Body bo'sh yoki noto'g'ri formatda");
  }
  const b = body as Record<string, unknown>;
  const action = b.action;
  if (typeof action !== 'string' || !VALID_ACTIONS.includes(action as any)) {
    throw new ValidationError(`Noto'g'ri amal: ${String(action)}`);
  }

  switch (action) {
    case 'approve': {
      const feedback = typeof b.feedback === 'string' ? b.feedback : undefined;
      return { action, feedback };
    }
    case 'reject':
    case 'request_revision': {
      if (typeof b.feedback !== 'string') {
        throw new ValidationError('feedback majburiy');
      }
      return { action, feedback: b.feedback };
    }
    case 'suspend': {
      if (typeof b.reason !== 'string') {
        throw new ValidationError('reason majburiy');
      }
      return { action, reason: b.reason };
    }
    case 'feature':
    case 'unfeature':
    case 'unsuspend':
      return { action };
    default:
      throw new ValidationError(`Noma'lum amal: ${action}`);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id: courseId } = await params;
    if (!courseId) {
      throw new ValidationError('Course ID berilmagan');
    }

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const payload = parseBody(raw);

    const updated = await applyAction(session.sub, courseId, payload, req);
    return jsonResponse({ course: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
