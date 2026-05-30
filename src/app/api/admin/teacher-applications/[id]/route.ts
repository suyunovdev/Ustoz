/**
 * PATCH /api/admin/teacher-applications/[id]
 *
 * Body:
 *   { action: 'start_review' }
 *   { action: 'approve',  feedback?: string }
 *   { action: 'reject',   feedback: string }
 *
 * Approve'da user role → teacher (transactional).
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  applyReviewAction,
  ApplicationNotFoundError,
  type ReviewActionPayload,
} from '@/lib/services/teacher-application.service';
import { ValidationError } from '@/lib/errors';

const VALID_ACTIONS = ['start_review', 'approve', 'reject'] as const;

function parseBody(body: unknown): ReviewActionPayload {
  if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
  const b = body as Record<string, unknown>;
  const action = b.action;
  if (typeof action !== 'string' || !VALID_ACTIONS.includes(action as any)) {
    throw new ValidationError(`Noto'g'ri amal: ${String(action)}`);
  }
  if (action === 'start_review') return { action };
  if (action === 'approve') {
    const feedback = typeof b.feedback === 'string' ? b.feedback : undefined;
    return { action, feedback };
  }
  if (action === 'reject') {
    if (typeof b.feedback !== 'string') {
      throw new ValidationError('feedback majburiy');
    }
    return { action, feedback: b.feedback };
  }
  throw new ValidationError(`Noma'lum amal: ${action}`);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id } = await params;
    if (!id) throw new ValidationError("Application ID berilmagan");

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const payload = parseBody(raw);

    const updated = await applyReviewAction(session.sub, id, payload, req);
    return jsonResponse({ application: updated });
  } catch (err) {
    if (err instanceof ApplicationNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
