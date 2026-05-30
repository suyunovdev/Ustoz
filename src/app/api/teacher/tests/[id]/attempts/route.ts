/**
 * GET /api/teacher/tests/[id]/attempts
 * Test'ga talabalar tomonidan topshirilgan natijalar.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listAttemptsForTeacher,
  TestAccessDeniedError,
} from '@/lib/services/test.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const attempts = await listAttemptsForTeacher(id, session.sub);
    return jsonResponse({ attempts });
  } catch (err) {
    if (err instanceof TestAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
