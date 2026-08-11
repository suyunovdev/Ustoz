/**
 * GET  /api/teacher/tests?courseId=&topicId=&status=  — teacher testlari
 * POST /api/teacher/tests                              — yangi test yaratish
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  createTest,
  addQuestion,
  assertValidQuestionInput,
  listTeacherTests,
  CourseAccessDeniedError,
  type AddQuestionInput,
} from '@/lib/services/test.service';
import { ValidationError } from '@/lib/errors';
import type { TestStatus, QuestionType, QuestionOption } from '@/lib/repositories';

const VALID_QTYPES: ReadonlyArray<QuestionType> = ['single', 'multiple', 'true_false', 'text'];

// Client yuborgan savolni AddQuestionInput shakliga xavfsiz o'giradi
function normalizeQuestion(raw: unknown): AddQuestionInput {
  const q = (raw ?? {}) as Record<string, unknown>;
  const questionType =
    typeof q.questionType === 'string' && VALID_QTYPES.includes(q.questionType as QuestionType)
      ? (q.questionType as QuestionType)
      : 'single';
  const options = Array.isArray(q.options)
    ? (q.options as QuestionOption[]).filter(
        (o) => o && typeof o === 'object' && typeof o.text === 'string',
      )
    : undefined;
  const correctAnswers = Array.isArray(q.correctAnswers)
    ? (q.correctAnswers as unknown[]).filter((v): v is string => typeof v === 'string')
    : undefined;
  return {
    questionText: typeof q.questionText === 'string' ? q.questionText : '',
    questionType,
    options,
    correctAnswers,
    points: typeof q.points === 'number' ? q.points : undefined,
    explanation: typeof q.explanation === 'string' ? q.explanation : undefined,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const topicId = searchParams.get('topicId') ?? undefined;
    const status = searchParams.get('status') as TestStatus | null;
    const tests = await listTeacherTests(session.sub, {
      courseId,
      topicId,
      status: status ?? undefined,
    });
    return jsonResponse({ tests });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, unknown>;

    const courseId = typeof b.courseId === 'string' ? b.courseId : '';
    if (!courseId) throw new ValidationError("courseId majburiy");

    // Savollarni AVVAL normalizatsiya + validatsiya qilamiz — shunda noto'g'ri savol
    // bo'lsa, test yaratilishidan OLDIN 400 qaytaramiz (orphan test bo'lmaydi).
    const questionInputs: AddQuestionInput[] = Array.isArray(b.questions)
      ? b.questions.map(normalizeQuestion)
      : [];
    for (const q of questionInputs) {
      assertValidQuestionInput(q);
    }

    const test = await createTest(session.sub, {
      courseId,
      topicId: typeof b.topicId === 'string' ? b.topicId : null,
      title: typeof b.title === 'string' ? b.title : '',
      description: typeof b.description === 'string' ? b.description : undefined,
      passingScore: typeof b.passingScore === 'number' ? b.passingScore : undefined,
      timeLimitSec:
        typeof b.timeLimitSec === 'number'
          ? b.timeLimitSec
          : b.timeLimitSec === null
          ? null
          : undefined,
      allowedAttempts: typeof b.allowedAttempts === 'number' ? b.allowedAttempts : undefined,
      randomizeQuestions:
        typeof b.randomizeQuestions === 'boolean' ? b.randomizeQuestions : undefined,
      showCorrectAnswers:
        typeof b.showCorrectAnswers === 'boolean' ? b.showCorrectAnswers : undefined,
    });

    // Savollar allaqachon validatsiyadan o'tgan — endi yaratamiz
    for (const q of questionInputs) {
      await addQuestion(test.id, session.sub, q);
    }

    return jsonResponse({ test, questionsCreated: questionInputs.length }, { status: 201 });
  } catch (err) {
    if (err instanceof CourseAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
