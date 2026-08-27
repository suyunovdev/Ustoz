/**
 * GET /api/teacher/students?courseId=&search=&activeOnly=
 * O'qituvchi kurslariga yozilgan talabalar aggregate ro'yxati.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listStudents } from '@/lib/services/teacher-student.service';
import type { TeacherStudentRow } from '@/lib/repositories/student.repository';

function serializeStudent(s: TeacherStudentRow) {
  return {
    ...s,
    totalPayments: s.totalPayments?.toString() ?? '0',
  };
}

/** So'rovdan musbat butun o'qish (yaroqsiz bo'lsa — undefined). */
function parseIntParam(v: string | null): number | undefined {
  if (v === null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId') ?? undefined;
    const search = searchParams.get('search') ?? undefined;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const limit = parseIntParam(searchParams.get('limit'));
    const offset = parseIntParam(searchParams.get('offset'));

    const { students, total, hasMore } = await listStudents(
      session.sub,
      { courseId, search, activeOnly },
      { limit, offset },
    );
    return jsonResponse({ students: students.map(serializeStudent), total, hasMore });
  } catch (err) {
    return errorResponse(err);
  }
}
