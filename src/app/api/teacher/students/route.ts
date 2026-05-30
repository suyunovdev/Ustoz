/**
 * GET /api/teacher/students?courseId=&search=&activeOnly=
 * O'qituvchi kurslariga yozilgan talabalar aggregate ro'yxati.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listStudents } from '@/lib/services/teacher-student.service';

function serializeStudent(s: any) {
  return {
    ...s,
    totalPayments: s.totalPayments?.toString() ?? '0',
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const students = await listStudents(session.sub, { courseId, search, activeOnly });
    return jsonResponse({ students: students.map(serializeStudent) });
  } catch (err) {
    return errorResponse(err);
  }
}
