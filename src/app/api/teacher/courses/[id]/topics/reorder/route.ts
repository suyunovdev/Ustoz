/**
 * POST /api/teacher/courses/[id]/topics/reorder
 * Drag & drop natijasi — bir vaqtda barcha topic'lar tartibi.
 * Body: { orderedIds: string[] }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { reorderTopics } from '@/lib/services/course-topic.service';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id: courseId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const orderedIds = (body as { orderedIds?: unknown })?.orderedIds;
    if (!Array.isArray(orderedIds) || orderedIds.some((x) => typeof x !== 'string')) {
      throw new ValidationError("orderedIds string array bo'lishi kerak");
    }

    const result = await reorderTopics(session.sub, courseId, orderedIds as string[]);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
