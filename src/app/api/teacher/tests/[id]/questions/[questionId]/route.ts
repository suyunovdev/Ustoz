/**
 * PATCH  /api/teacher/tests/[id]/questions/[questionId]
 * DELETE /api/teacher/tests/[id]/questions/[questionId]
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  updateQuestion,
  deleteQuestion,
  TestAccessDeniedError,
} from '@/lib/services/test.service';
import { ValidationError } from '@/lib/errors';
import type { QuestionType, QuestionOption } from '@/lib/repositories';

const VALID_TYPES: ReadonlyArray<QuestionType> = ['single', 'multiple', 'true_false', 'text'];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { questionId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const questionType =
      typeof b.questionType === 'string' && VALID_TYPES.includes(b.questionType as QuestionType)
        ? (b.questionType as QuestionType)
        : undefined;

    const options = Array.isArray(b.options)
      ? (b.options as QuestionOption[]).filter(
          (o) => typeof o === 'object' && o !== null && typeof o.text === 'string',
        )
      : undefined;

    const correctAnswers = Array.isArray(b.correctAnswers)
      ? (b.correctAnswers as unknown[]).filter((v): v is string => typeof v === 'string')
      : undefined;

    const updated = await updateQuestion(questionId, session.sub, {
      questionText: typeof b.questionText === 'string' ? b.questionText : undefined,
      questionType,
      options,
      correctAnswers,
      points: typeof b.points === 'number' ? b.points : undefined,
      explanation:
        b.explanation === null
          ? null
          : typeof b.explanation === 'string'
          ? b.explanation
          : undefined,
      questionOrder: typeof b.questionOrder === 'number' ? b.questionOrder : undefined,
    });

    return jsonResponse({ question: updated });
  } catch (err) {
    if (err instanceof TestAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ questionId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { questionId } = await params;
    await deleteQuestion(questionId, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof TestAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
