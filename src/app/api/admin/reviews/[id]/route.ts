/**
 * PATCH /api/admin/reviews/[id]
 *
 * Body:
 *   { action: 'hide',    reason: string }   // soft hide
 *   { action: 'unhide' }                    // qayta ko'rsatish
 *   { action: 'delete',  reason: string }   // hard delete + rating recompute
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  applyAction,
  ReviewNotFoundError,
  type ReviewActionPayload,
} from '@/lib/services/review-moderation.service';
import { ValidationError } from '@/lib/errors';

const VALID_ACTIONS = ['hide', 'unhide', 'delete'] as const;

function parseBody(body: unknown): ReviewActionPayload {
  if (!body || typeof body !== 'object') {
    throw new ValidationError("Body bo'sh");
  }
  const b = body as Record<string, unknown>;
  const action = b.action;
  if (typeof action !== 'string' || !VALID_ACTIONS.includes(action as any)) {
    throw new ValidationError(`Noto'g'ri amal: ${String(action)}`);
  }
  if (action === 'unhide') return { action };
  if (action === 'hide' || action === 'delete') {
    if (typeof b.reason !== 'string') {
      throw new ValidationError('reason majburiy');
    }
    return { action, reason: b.reason };
  }
  throw new ValidationError(`Noma'lum amal: ${action}`);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin(req);
    const { id: reviewId } = await params;
    if (!reviewId) throw new ValidationError("Review ID berilmagan");

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const payload = parseBody(raw);

    const result = await applyAction(session.sub, reviewId, payload, req);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof ReviewNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
