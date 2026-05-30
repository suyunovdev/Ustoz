/**
 * POST /api/conversations/start
 *
 * Suhbatni boshlash (yoki mavjudini qaytarish).
 *   Teacher: body = { studentId, courseId? }
 *   Student: body = { teacherId, courseId? }
 *
 * Talaba/teacher ulanishi tekshiriladi.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  ensureConversationFromTeacher,
  ensureConversationFromStudent,
  CannotStartConversationError,
} from '@/lib/services/messaging.service';
import { ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const courseId = typeof b.courseId === 'string' ? b.courseId : undefined;

    let conv;
    if (session.role === 'teacher' || session.role === 'admin') {
      const studentId = typeof b.studentId === 'string' ? b.studentId : '';
      if (!studentId) throw new ValidationError("studentId majburiy");
      conv = await ensureConversationFromTeacher(session.sub, studentId, courseId);
    } else {
      const teacherId = typeof b.teacherId === 'string' ? b.teacherId : '';
      if (!teacherId) throw new ValidationError("teacherId majburiy");
      conv = await ensureConversationFromStudent(session.sub, teacherId, courseId);
    }
    return jsonResponse({ conversation: conv }, { status: 201 });
  } catch (err) {
    if (err instanceof CannotStartConversationError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
