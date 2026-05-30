/**
 * PATCH  /api/teacher/courses/[id]/topics/[topicId] — mavzuni tahrirlash
 * DELETE /api/teacher/courses/[id]/topics/[topicId] — mavzuni o'chirish
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  updateTopic,
  deleteTopic,
  TopicNotFoundError,
} from '@/lib/services/course-topic.service';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';

export async function PATCH(
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
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, unknown>;

    const updated = await updateTopic(session.sub, topicId, {
      title: typeof b.title === 'string' ? b.title : undefined,
      description:
        b.description === null
          ? null
          : typeof b.description === 'string'
          ? b.description
          : undefined,
      videoUrl:
        b.videoUrl === null
          ? null
          : typeof b.videoUrl === 'string'
          ? b.videoUrl
          : undefined,
      duration: typeof b.duration === 'string' ? b.duration : undefined,
      content: typeof b.content === 'string' ? b.content : undefined,
      hasQuiz: typeof b.hasQuiz === 'boolean' ? b.hasQuiz : undefined,
      isFreePreview: typeof b.isFreePreview === 'boolean' ? b.isFreePreview : undefined,
      isLocked: typeof b.isLocked === 'boolean' ? b.isLocked : undefined,
      moduleTitle:
        b.moduleTitle === null
          ? null
          : typeof b.moduleTitle === 'string'
          ? b.moduleTitle
          : undefined,
    });
    return jsonResponse({ topic: updated });
  } catch (err) {
    if (err instanceof TopicNotFoundError || err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { topicId } = await params;
    const result = await deleteTopic(session.sub, topicId);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof TopicNotFoundError || err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
