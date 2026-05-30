/**
 * GET /api/teacher/assignments/[id]/submissions
 * Vazifaga topshirilgan ishlar (status filter ixtiyoriy)
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listSubmissionsForTeacher,
  AssignmentAccessDeniedError,
} from '@/lib/services/assignment.service';
import type { SubmissionStatus } from '@/lib/repositories';

const VALID_STATUS: ReadonlyArray<SubmissionStatus> = [
  'submitted',
  'graded',
  'returned',
  'late',
];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const status =
      statusParam && VALID_STATUS.includes(statusParam as SubmissionStatus)
        ? (statusParam as SubmissionStatus)
        : undefined;

    const submissions = await listSubmissionsForTeacher(id, session.sub, { status });
    return jsonResponse({ submissions });
  } catch (err) {
    if (err instanceof AssignmentAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
