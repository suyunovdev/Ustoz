/**
 * GET /api/teacher/students/[studentId]
 * Talabaning to'liq profili (faqat teacher kurslari bo'yicha).
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  getStudentDetail,
  StudentNotFoundError,
} from '@/lib/services/teacher-student.service';

function serialize(d: any) {
  return {
    ...d,
    totalPaymentsUzs: d.totalPaymentsUzs?.toString() ?? '0',
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { studentId } = await params;
    const detail = await getStudentDetail(studentId, session.sub);
    return jsonResponse({ student: serialize(detail) });
  } catch (err) {
    if (err instanceof StudentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
