/**
 * POST /api/tests/[id]/attempts
 *
 * Talaba test topshirishni boshlaydi.
 * - Agar avval boshlanmagan urinish bo'lsa — uni qaytaradi (resume).
 * - Test 'published' bo'lishi shart.
 * - allowedAttempts > 0 va limit yetgan bo'lsa — 429.
 *
 * Response:
 *   {
 *     attempt: { id, attemptNumber, startedAt, timeLimitSec },
 *     questions: [{ id, questionText, questionType, options, points }],
 *     test: { id, title, timeLimitSec, totalPoints, passingScore }
 *   }
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  startTestAttempt,
  TestNotFoundError,
  TestNotPublishedError,
  AttemptLimitExceededError,
} from '@/lib/services/test.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const result = await startTestAttempt(id, session.sub);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof TestNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof TestNotPublishedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    if (err instanceof AttemptLimitExceededError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 429 });
    }
    return errorResponse(err);
  }
}
