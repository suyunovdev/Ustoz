/**
 * POST /api/teacher/students/[studentId]/notify
 * Body: { title, message, courseId? }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  notifyStudent,
  StudentNotFoundError,
} from '@/lib/services/teacher-student.service';
import { ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { studentId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;

    const notification = await notifyStudent(studentId, session.sub, {
      title: typeof b.title === 'string' ? b.title : '',
      message: typeof b.message === 'string' ? b.message : '',
      courseId: typeof b.courseId === 'string' ? b.courseId : null,
    });

    return jsonResponse({ notification }, { status: 201 });
  } catch (err) {
    if (err instanceof StudentNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
