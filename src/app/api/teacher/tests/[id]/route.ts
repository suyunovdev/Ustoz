/**
 * GET    /api/teacher/tests/[id]  — test + questions
 * PATCH  /api/teacher/tests/[id]  — testni yangilash (status: draft|published|archived)
 * DELETE /api/teacher/tests/[id]
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getTestForTeacher,
  updateTest,
  deleteTest,
  TestNotFoundError,
  TestAccessDeniedError,
} from '@/lib/services/test.service';
import { ValidationError } from '@/lib/errors';
import type { TestStatus } from '@/lib/repositories';

const VALID_STATUSES: ReadonlyArray<TestStatus> = ['draft', 'published', 'archived'];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const test = await getTestForTeacher(id, session.sub);
    return jsonResponse({ test });
  } catch (err) {
    if (err instanceof TestNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof TestAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function PATCH(
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
    const b = (body ?? {}) as Record<string, unknown>;

    const status =
      typeof b.status === 'string' && VALID_STATUSES.includes(b.status as TestStatus)
        ? (b.status as TestStatus)
        : undefined;

    const test = await updateTest(id, session.sub, {
      title: typeof b.title === 'string' ? b.title : undefined,
      description:
        b.description === null
          ? null
          : typeof b.description === 'string'
          ? b.description
          : undefined,
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
      topicId:
        b.topicId === null
          ? null
          : typeof b.topicId === 'string'
          ? b.topicId
          : undefined,
      status,
    });

    return jsonResponse({ test });
  } catch (err) {
    if (err instanceof TestNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof TestAccessDeniedError) {
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
    await deleteTest(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof TestAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
