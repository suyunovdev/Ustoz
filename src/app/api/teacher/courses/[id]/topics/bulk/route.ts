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
import { prisma } from '@/lib/prisma';
import { courseTopicRepo } from '@/lib/repositories';
import { recomputeEnrollmentsForCourse } from '@/lib/services/progress.service';
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

    // Har qatorni validatsiya qilamiz — yaroqsizlari errors[]ga, yaroqlilari
    // bitta createMany bilan (ilgari har qator alohida create + maxOrder
    // aggregate edi → ~2×N so'rov; endi bitta aggregate + bitta insert).
    const validData: Array<{
      courseId: string;
      title: string;
      description: string | null;
      videoUrl: string | null;
      duration: string;
      moduleTitle: string | null;
    }> = [];
    const errors: Array<{ index: number; error: string }> = [];

    rawTopics.forEach((raw, i) => {
      const r = raw as RawTopic;
      const title = typeof r.title === 'string' ? r.title.trim() : '';
      if (title.length < 2) {
        errors.push({ index: i, error: 'Title kamida 2 belgi' });
        return;
      }
      if (title.length > 200) {
        errors.push({ index: i, error: 'Title 200 belgidan oshmasin' });
        return;
      }
      const videoUrl = typeof r.videoUrl === 'string' && r.videoUrl.trim() ? r.videoUrl.trim() : null;
      validData.push({
        courseId,
        title,
        description: typeof r.description === 'string' ? r.description : null,
        videoUrl,
        duration: typeof r.duration === 'string' && r.duration ? r.duration : '0 min',
        moduleTitle: typeof r.moduleTitle === 'string' ? r.moduleTitle : null,
      });
    });

    let createdCount = 0;
    if (validData.length > 0) {
      // Yaratish — bitta transaction: oxirgi orderIndex'ni bir marta olib,
      // ketma-ket orderIndex bilan hammasini insert qilamiz.
      createdCount = await prisma.$transaction(async (tx) => {
        const agg = await tx.courseTopic.aggregate({
          where: { courseId },
          _max: { orderIndex: true },
        });
        const base = agg._max.orderIndex ?? 0;
        const result = await tx.courseTopic.createMany({
          data: validData.map((d, idx) => ({ ...d, orderIndex: base + idx + 1 })),
        });
        return result.count;
      });

      // Mavzular qo'shildi → talabalar progress maxraji o'zgardi. Yakka-create
      // yo'li buni qilardi, bulk esa o'tkazib yubordardi (progress % oshib ketardi).
      await recomputeEnrollmentsForCourse(courseId);
    }

    return jsonResponse({
      createdCount,
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
