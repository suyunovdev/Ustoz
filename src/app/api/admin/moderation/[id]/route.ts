/**
 * PATCH /api/admin/moderation/[id]
 *
 * Body:
 *   { action: 'start_review' }
 *   { action: 'approve',           feedback?: string }
 *   { action: 'reject',            feedback: string }
 *   { action: 'request_revision',  feedback: string }
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  applyAction,
  QueueItemNotFoundError,
  type MaterialActionPayload,
} from '@/lib/services/content-moderation.service';
import { ValidationError } from '@/lib/errors';

const VALID_ACTIONS = ['start_review', 'approve', 'reject', 'request_revision'] as const;

function parseBody(body: unknown): MaterialActionPayload {
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
  if (action === 'reject' || action === 'request_revision') {
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
    if (!id) throw new ValidationError("Queue ID berilmagan");

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const payload = parseBody(raw);

    const updated = await applyAction(session.sub, id, payload, req);
    return jsonResponse({ item: updated });
  } catch (err) {
    if (err instanceof QueueItemNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
