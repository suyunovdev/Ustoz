/**
 * GET  /api/teacher/tests?courseId=&topicId=&status=  — teacher testlari
 * POST /api/teacher/tests                              — yangi test yaratish
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  createTest,
  listTeacherTests,
  CourseAccessDeniedError,
} from '@/lib/services/test.service';
import { ValidationError } from '@/lib/errors';
import type { TestStatus } from '@/lib/repositories';

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

    return jsonResponse({ test }, { status: 201 });
  } catch (err) {
    if (err instanceof CourseAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
