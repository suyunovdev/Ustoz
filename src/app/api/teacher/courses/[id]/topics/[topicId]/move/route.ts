/**
 * POST /api/teacher/courses/[id]/topics/[topicId]/move
 * Body: { direction: 'up' | 'down' }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { moveTopic, TopicNotFoundError } from '@/lib/services/course-topic.service';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { topicId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const direction = (body as Record<string, unknown> | null)?.direction;
    if (direction !== 'up' && direction !== 'down') {
      throw new ValidationError("direction 'up' yoki 'down' bo'lishi kerak");
    }

    const result = await moveTopic(session.sub, topicId, direction);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof TopicNotFoundError || err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
