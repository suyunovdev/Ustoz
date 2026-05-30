/**
 * POST /api/teacher/courses/[id]/duplicate
 * Kursni topic'lari bilan birga nusxalash.
 * Status: draft, isPublished: false.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { duplicateCourse } from '@/lib/services/teacher-course.service';
import { CourseNotFoundError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const duplicated = await duplicateCourse(id, session.sub);
    return jsonResponse({
      course: { ...duplicated, priceUzs: duplicated.priceUzs.toString() },
    });
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
