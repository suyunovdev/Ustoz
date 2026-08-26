/**
 * GET    /api/teacher/courses/[id]   — bitta kurs (faqat o'z kursi)
 * PATCH  /api/teacher/courses/[id]   — tahrirlash
 * DELETE /api/teacher/courses/[id]   — o'chirish (enrollment yo'q bo'lsa)
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { TargetAudience, SubjectCategory } from '@/generated/prisma/enums';
import {
  getCourse,
  deleteCourse,
  CourseHasEnrollmentsError,
} from '@/lib/services/teacher-course.service';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';
import { recomputeEnrollmentsForCourse } from '@/lib/services/progress.service';

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

    // Narxni oldindan tekshiramiz — BigInt noto'g'ri inputda 500 bermasin
    let priceUpdate: bigint | undefined;
    if (b.priceUzs !== undefined) {
      try {
        priceUpdate = BigInt(b.priceUzs);
        if (priceUpdate < BigInt(0)) throw new Error('negative');
      } catch {
        throw new ValidationError("Narx noto'g'ri (butun musbat son bo'lishi kerak)");
      }
    }

    // Enum maydonlar (mavjud bo'lsa) — oldindan tekshiramiz (aniq 400 xabar).
    if (b.targetAudience !== undefined &&
        !(Object.values(TargetAudience) as string[]).includes(b.targetAudience)) {
      throw new ValidationError(`targetAudience noto'g'ri qiymat: ${String(b.targetAudience)}`);
    }
    if (b.subjectCategory !== undefined &&
        !(Object.values(SubjectCategory) as string[]).includes(b.subjectCategory)) {
      throw new ValidationError(`subjectCategory noto'g'ri qiymat: ${String(b.subjectCategory)}`);
    }

    // Moderatsiya: o'qituvchi `isPublished`ni O'ZI qo'ya olmaydi — kurs faqat
    // admin tasdig'idan keyin jonli bo'ladi. Tasdiqlangan kursni tahrirlash uni
    // qayta tekshiruvga qaytaradi (jonlilikdan vaqtincha olib turadi).
    const needsReReview = existing.moderationStatus === 'approved';

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
        ...(priceUpdate !== undefined && { priceUzs: priceUpdate }),
        ...(b.coverImage !== undefined && { coverImage: b.coverImage }),
        ...(b.language && { language: b.language }),
        ...(b.difficultyLevel !== undefined && { difficultyLevel: b.difficultyLevel }),
        ...(needsReReview && {
          moderationStatus: 'submitted',
          isPublished: false,
          adminFeedback: null,
        }),
      },
    });

    // Topics yangilash — POZITSIYA bo'yicha reconcile.
    // Ilgari deleteMany+createMany ishlatilardi → mavjud topic'lar yangi UUID
    // oladi va `topic_completions` (onDelete: Cascade) O'CHIB KETADI, ya'ni bitta
    // tahrir barcha talabalar progressini yo'q qilardi. Endi mavjud qatorlar
    // JOYIDA yangilanadi (id saqlanadi → completions saqlanadi), ortiqchasi
    // qo'shiladi, kamayganи o'chiriladi.
    if (Array.isArray(b.topics)) {
      const incoming = b.topics as Array<Record<string, any>>;
      const existingTopics = await prisma.courseTopic.findMany({
        where: { courseId: id },
        orderBy: { orderIndex: 'asc' },
        select: { id: true },
      });
      const overlap = Math.min(existingTopics.length, incoming.length);
      for (let i = 0; i < overlap; i++) {
        await prisma.courseTopic.update({
          where: { id: existingTopics[i].id },
          data: {
            title: incoming[i].title,
            orderIndex: i + 1,
            duration: incoming[i].duration || '0 min',
            content: incoming[i].content || '',
            videoUrl: typeof incoming[i].videoUrl === 'string' && incoming[i].videoUrl.trim() ? incoming[i].videoUrl.trim() : null,
            hasQuiz: !!incoming[i].hasQuiz,
          },
        });
      }
      for (let i = overlap; i < incoming.length; i++) {
        await prisma.courseTopic.create({
          data: {
            courseId: id,
            title: incoming[i].title,
            orderIndex: i + 1,
            duration: incoming[i].duration || '0 min',
            content: incoming[i].content || '',
            videoUrl: typeof incoming[i].videoUrl === 'string' && incoming[i].videoUrl.trim() ? incoming[i].videoUrl.trim() : null,
            hasQuiz: !!incoming[i].hasQuiz,
          },
        });
      }
      if (existingTopics.length > incoming.length) {
        const toDelete = existingTopics.slice(incoming.length).map((t) => t.id);
        await prisma.courseTopic.deleteMany({ where: { id: { in: toDelete } } });
      }
      // Mavzular soni o'zgargan bo'lishi mumkin → talabalar progressini qayta hisoblash
      await recomputeEnrollmentsForCourse(id);
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
