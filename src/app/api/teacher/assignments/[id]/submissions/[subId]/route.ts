/**
 * PATCH /api/teacher/assignments/[id]/submissions/[subId]
 *
 * Body (grade): { grade: number, feedback?: string, applyLatePenalty?: boolean }
 * Body (return): { action: 'return', feedback: string }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  gradeSubmission,
  returnForRevision,
  SubmissionNotFoundError,
  AssignmentAccessDeniedError,
  AssignmentNotFoundError,
} from '@/lib/services/assignment.service';
import { ValidationError } from '@/lib/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ subId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { subId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    if (b.action === 'return') {
      const feedback = typeof b.feedback === 'string' ? b.feedback : '';
      const updated = await returnForRevision(subId, session.sub, feedback);
      return jsonResponse({ submission: updated });
    }

    if (typeof b.grade !== 'number') {
      throw new ValidationError("grade majburiy");
    }
    const updated = await gradeSubmission(subId, session.sub, {
      grade: b.grade,
      feedback: typeof b.feedback === 'string' ? b.feedback : undefined,
      applyLatePenalty: typeof b.applyLatePenalty === 'boolean' ? b.applyLatePenalty : false,
    });
    return jsonResponse({ submission: updated });
  } catch (err) {
    if (err instanceof SubmissionNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof AssignmentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof AssignmentAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
