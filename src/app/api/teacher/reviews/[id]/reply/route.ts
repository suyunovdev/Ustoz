/**
 * PUT    /api/teacher/reviews/[id]/reply — javob yozish/tahrirlash
 * DELETE /api/teacher/reviews/[id]/reply — javobni o'chirish
 *
 * Body (PUT): { reply: string }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  setReviewReply,
  deleteReviewReply,
  ReviewAccessDeniedError,
} from '@/lib/services/review.service';
import { ValidationError } from '@/lib/errors';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const reply = (body as { reply?: unknown })?.reply;
    if (typeof reply !== 'string') throw new ValidationError("reply majburiy");
    await setReviewReply(id, session.sub, reply);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof ReviewAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    await deleteReviewReply(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof ReviewAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
