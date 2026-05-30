/**
 * POST /api/attempts/[id]/submit
 *
 * Talaba o'z urinishini topshiradi. Auto-grading bajariladi.
 *
 * Body: { answers: { [questionId: string]: string | string[] } }
 *
 * Response:
 *   {
 *     attempt: { score, maxScore, percentage, passed },
 *     results: [{ questionId, correct, pointsEarned, correctAnswer?, explanation? }],
 *     passed: boolean
 *   }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  submitTestAttempt,
  AttemptNotFoundError,
  AttemptAlreadySubmittedError,
  TestAccessDeniedError,
} from '@/lib/services/test.service';
import { ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const answersRaw = b.answers;
    if (!answersRaw || typeof answersRaw !== 'object') {
      throw new ValidationError("answers object bo'lishi kerak");
    }
    const answers: Record<string, string | string[]> = {};
    for (const [k, v] of Object.entries(answersRaw)) {
      if (typeof v === 'string') answers[k] = v;
      else if (Array.isArray(v) && v.every((x) => typeof x === 'string')) answers[k] = v as string[];
    }

    const result = await submitTestAttempt(id, session.sub, answers);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof AttemptNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof AttemptAlreadySubmittedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    if (err instanceof TestAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
