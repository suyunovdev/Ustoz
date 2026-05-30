/**
 * GET /api/assignments/[id]/my-submission
 * Talabaning ushbu vazifaga eng so'nggi topshirig'i (null bo'lishi mumkin).
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getMySubmission } from '@/lib/services/assignment.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;
    const submission = await getMySubmission(id, session.sub);
    return jsonResponse({ submission });
  } catch (err) {
    return errorResponse(err);
  }
}
