/**
 * POST /api/teacher/courses/[id]/topics/bulk
 * Bir vaqtda bir nechta mavzu yaratish (CSV/TSV paste).
 *
 * Body:
 *   { topics: Array<{ title, description?, videoUrl?, duration?, moduleTitle? }> }
 *
 * Max 100 ta bir martada.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { courseTopicRepo } from '@/lib/repositories';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';

const MAX_BULK = 100;

interface RawTopic {
  title?: unknown;
  description?: unknown;
  videoUrl?: unknown;
  duration?: unknown;
  moduleTitle?: unknown;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id: courseId } = await params;

    const isOwner = await courseTopicRepo.isCourseOwner(courseId, session.sub);
    if (!isOwner) throw new CourseNotFoundError(courseId);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const rawTopics = (body as { topics?: unknown })?.topics;
    if (!Array.isArray(rawTopics) || rawTopics.length === 0) {
      throw new ValidationError("topics array bo'lishi kerak");
    }
    if (rawTopics.length > MAX_BULK) {
      throw new ValidationError(`Bir martada ${MAX_BULK} ta mavzudan ko'p yuborib bo'lmaydi`);
    }

    const created: string[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < rawTopics.length; i++) {
      const r = rawTopics[i] as RawTopic;
      const title = typeof r.title === 'string' ? r.title.trim() : '';
      if (title.length < 2) {
        errors.push({ index: i, error: "Title kamida 2 belgi" });
        continue;
      }
      try {
        const topic = await courseTopicRepo.create({
          courseId,
          title,
          description: typeof r.description === 'string' ? r.description : null,
          videoUrl: typeof r.videoUrl === 'string' ? r.videoUrl : null,
          duration: typeof r.duration === 'string' ? r.duration : '0 min',
          moduleTitle: typeof r.moduleTitle === 'string' ? r.moduleTitle : null,
        });
        created.push(topic.id);
      } catch (err) {
        errors.push({
          index: i,
          error: err instanceof Error ? err.message : 'Unknown',
        });
      }
    }

    return jsonResponse({
      createdCount: created.length,
      errorCount: errors.length,
      errors,
    });
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
