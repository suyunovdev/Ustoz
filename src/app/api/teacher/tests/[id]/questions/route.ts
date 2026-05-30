/**
 * POST /api/teacher/tests/[id]/questions  — yangi savol qo'shish
 *
 * Body:
 *   {
 *     questionText,
 *     questionType: 'single' | 'multiple' | 'true_false' | 'text',
 *     options?: [{text, isCorrect}],   // single/multiple uchun
 *     correctAnswers?: string[],       // text/true_false uchun
 *     points?,
 *     explanation?
 *   }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  addQuestion,
  TestAccessDeniedError,
} from '@/lib/services/test.service';
import { ValidationError } from '@/lib/errors';
import type { QuestionType, QuestionOption } from '@/lib/repositories';

const VALID_TYPES: ReadonlyArray<QuestionType> = ['single', 'multiple', 'true_false', 'text'];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id: testId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const questionType = b.questionType;
    if (typeof questionType !== 'string' || !VALID_TYPES.includes(questionType as QuestionType)) {
      throw new ValidationError(`Noto'g'ri tur: ${String(questionType)}`);
    }

    const options = Array.isArray(b.options)
      ? (b.options as QuestionOption[]).filter(
          (o) => typeof o === 'object' && o !== null && typeof o.text === 'string',
        )
      : undefined;

    const correctAnswers = Array.isArray(b.correctAnswers)
      ? (b.correctAnswers as unknown[]).filter((v): v is string => typeof v === 'string')
      : undefined;

    const question = await addQuestion(testId, session.sub, {
      questionText: typeof b.questionText === 'string' ? b.questionText : '',
      questionType: questionType as QuestionType,
      options,
      correctAnswers,
      points: typeof b.points === 'number' ? b.points : undefined,
      explanation: typeof b.explanation === 'string' ? b.explanation : undefined,
    });

    return jsonResponse({ question }, { status: 201 });
  } catch (err) {
    if (err instanceof TestAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
