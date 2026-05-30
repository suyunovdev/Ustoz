/**
 * PATCH  /api/teacher/enrollments/[id] — isActive toggle
 * DELETE /api/teacher/enrollments/[id] — talabani kursdan olib tashlash
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  setEnrollmentActive,
  removeEnrollment,
  EnrollmentAccessDeniedError,
} from '@/lib/services/teacher-student.service';
import { ValidationError } from '@/lib/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;
    if (typeof b.isActive !== 'boolean') {
      throw new ValidationError("isActive boolean bo'lishi kerak");
    }
    const updated = await setEnrollmentActive(id, session.sub, b.isActive);
    return jsonResponse({ enrollment: updated });
  } catch (err) {
    if (err instanceof EnrollmentAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    await removeEnrollment(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof EnrollmentAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
