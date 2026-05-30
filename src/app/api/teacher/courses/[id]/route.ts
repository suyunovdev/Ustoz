/**
 * GET    /api/teacher/courses/[id]   — bitta kurs (faqat o'z kursi)
 * PATCH  /api/teacher/courses/[id]   — tahrirlash
 * DELETE /api/teacher/courses/[id]   — o'chirish (enrollment yo'q bo'lsa)
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import {
  getCourse,
  deleteCourse,
  CourseHasEnrollmentsError,
} from '@/lib/services/teacher-course.service';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const course = await getCourse(id, session.sub);
    return jsonResponse({ course });
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;

    const existing = await prisma.course.findFirst({
      where: { id, teacherId: session.sub },
    });
    if (!existing) throw new CourseNotFoundError(id);

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, any>;

    const updated = await prisma.course.update({
      where: { id },
      data: {
        ...(b.title && { title: b.title }),
        ...(b.description !== undefined && { description: b.description }),
        ...(b.category && { category: b.category }),
        ...(b.categoryId !== undefined && { categoryId: b.categoryId }),
        ...(b.targetAudience && { targetAudience: b.targetAudience }),
        ...(b.subjectCategory && { subjectCategory: b.subjectCategory }),
        ...(b.gradeLevel !== undefined && {
          gradeLevel: b.gradeLevel ? Number(b.gradeLevel) : null,
        }),
        ...(b.priceUzs !== undefined && { priceUzs: BigInt(b.priceUzs) }),
        ...(b.coverImage !== undefined && { coverImage: b.coverImage }),
        ...(b.language && { language: b.language }),
        ...(b.difficultyLevel !== undefined && { difficultyLevel: b.difficultyLevel }),
        ...(b.isPublished !== undefined && {
          isPublished: b.isPublished,
          publishedAt:
            b.isPublished && !existing.isPublished ? new Date() : existing.publishedAt,
        }),
      },
    });

    // Topics yangilash
    if (Array.isArray(b.topics)) {
      await prisma.courseTopic.deleteMany({ where: { courseId: id } });
      if (b.topics.length > 0) {
        await prisma.courseTopic.createMany({
          data: b.topics.map((t: any, i: number) => ({
            courseId: id,
            title: t.title,
            orderIndex: i + 1,
            duration: t.duration || '0 min',
            content: t.content || '',
            hasQuiz: !!t.hasQuiz,
          })),
        });
      }
    }

    return jsonResponse({
      course: { ...updated, priceUzs: updated.priceUzs.toString() },
    });
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
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
    await deleteCourse(id, session.sub);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof CourseNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof CourseHasEnrollmentsError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 409 });
    }
    return errorResponse(err);
  }
}
