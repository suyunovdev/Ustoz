/**
 * GET  /api/teacher/courses/[id]/topics — mavzular ro'yxati
 * POST /api/teacher/courses/[id]/topics — yangi mavzu qo'shish
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listTopics,
  createTopic,
} from '@/lib/services/course-topic.service';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id: courseId } = await params;
    const topics = await listTopics(courseId, session.sub);
    return jsonResponse({ topics });
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}

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
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, unknown>;

    const topic = await createTopic(session.sub, {
      courseId,
      title: typeof b.title === 'string' ? b.title : '',
      description: typeof b.description === 'string' ? b.description : undefined,
      videoUrl: typeof b.videoUrl === 'string' ? b.videoUrl : undefined,
      duration: typeof b.duration === 'string' ? b.duration : undefined,
      content: typeof b.content === 'string' ? b.content : undefined,
      hasQuiz: typeof b.hasQuiz === 'boolean' ? b.hasQuiz : undefined,
      isFreePreview: typeof b.isFreePreview === 'boolean' ? b.isFreePreview : undefined,
      isLocked: typeof b.isLocked === 'boolean' ? b.isLocked : undefined,
      moduleTitle: typeof b.moduleTitle === 'string' ? b.moduleTitle : undefined,
    });
    return jsonResponse({ topic });
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
