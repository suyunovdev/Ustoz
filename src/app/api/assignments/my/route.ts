/**
 * GET /api/assignments/my
 * Talabaning barcha topshiriqlari.
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse, serializeData } from '@/lib/json';
import { assignmentRepo } from '@/lib/repositories';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const submissions = await assignmentRepo.listStudentSubmissions(session.sub);
    return jsonResponse({ assignments: serializeData(submissions) });
  } catch (err) {
    return errorResponse(err);
  }
}
