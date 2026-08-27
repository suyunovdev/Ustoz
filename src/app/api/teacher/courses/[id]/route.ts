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

/** Reconcile'da bitta mavzu qatoriga yoziladigan maydonlar (create ham, update ham). */
function buildTopicWrite(tp: Record<string, unknown>, order: number) {
  const videoUrl = typeof tp.videoUrl === 'string' && tp.videoUrl.trim() ? tp.videoUrl.trim() : null;
  return {
    title: String(tp.title).trim(),
    orderIndex: order,
    duration: typeof tp.duration === 'string' && tp.duration ? tp.duration : '0 min',
    content: typeof tp.content === 'string' ? tp.content : '',
    videoUrl,
    hasQuiz: !!tp.hasQuiz,
  };
}

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

    // ── Matn maydonlari — tur/uzunlik tekshiruvi (aks holda number/uzun input
    //    to'g'ridan-to'g'ri Prisma'ga borib 500 berardi) ──
    const assertStr = (v: unknown, field: string, max: number) => {
      if (typeof v !== 'string') throw new ValidationError(`${field} matn bo'lishi kerak`);
      if (v.length > max) throw new ValidationError(`${field} ${max} belgidan oshmasin`);
    };
    if (b.title !== undefined) {
      assertStr(b.title, 'title', 200);
      if (b.title.trim().length < 2) throw new ValidationError('title kamida 2 belgi');
    }
    if (b.description !== undefined && b.description !== null) assertStr(b.description, 'description', 5000);
    if (b.category !== undefined && b.category !== null) assertStr(b.category, 'category', 100);
    if (b.language !== undefined && b.language !== null) assertStr(b.language, 'language', 50);
    if (b.coverImage !== undefined && b.coverImage !== null) assertStr(b.coverImage, 'coverImage', 2000);
    if (b.difficultyLevel !== undefined && b.difficultyLevel !== null) assertStr(b.difficultyLevel, 'difficultyLevel', 50);

    // gradeLevel — musbat butun yoki bo'sh (NaN yozilmasin)
    let gradeLevelUpdate: number | null | undefined;
    if (b.gradeLevel !== undefined) {
      if (b.gradeLevel === null || b.gradeLevel === '') {
        gradeLevelUpdate = null;
      } else {
        const n = Number(b.gradeLevel);
        if (!Number.isInteger(n) || n < 0 || n > 20) {
          throw new ValidationError("gradeLevel noto'g'ri (0–20 oralig'ida butun son)");
        }
        gradeLevelUpdate = n;
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

    // Kiruvchi mavzular (bo'lsa) — title'ni oldindan validatsiya (recon.dan avval).
    const incomingTopics = Array.isArray(b.topics)
      ? (b.topics as Array<Record<string, unknown>>)
      : null;
    if (incomingTopics) {
      incomingTopics.forEach((tp, i) => {
        const title = typeof tp.title === 'string' ? tp.title.trim() : '';
        if (title.length < 2) throw new ValidationError(`Mavzu #${i + 1}: nomi kamida 2 belgi`);
        if (title.length > 200) throw new ValidationError(`Mavzu #${i + 1}: nomi 200 belgidan oshmasin`);
      });
    }

    // Kurs yangilash + mavzu reconcile — BITTA transaction (yarim yangilanish
    // qolmasin). Reconcile POZITSIYA bo'yicha: mavjud qatorlar joyida yangilanadi
    // (id saqlanadi → topic_completions saqlanadi), ortiqchasi qo'shiladi, kamaygani
    // o'chiriladi. Ilgari bu updates/creates/delete alohida, transaction'siz edi.
    let topicCountChanged = false;
    const updated = await prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { id },
        data: {
          ...(b.title && { title: b.title }),
          ...(b.description !== undefined && { description: b.description }),
          ...(b.category && { category: b.category }),
          ...(b.categoryId !== undefined && { categoryId: b.categoryId }),
          ...(b.targetAudience && { targetAudience: b.targetAudience }),
          ...(b.subjectCategory && { subjectCategory: b.subjectCategory }),
          ...(gradeLevelUpdate !== undefined && { gradeLevel: gradeLevelUpdate }),
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

      if (incomingTopics) {
        const existingTopics = await tx.courseTopic.findMany({
          where: { courseId: id },
          orderBy: { orderIndex: 'asc' },
          select: { id: true },
        });
        topicCountChanged = existingTopics.length !== incomingTopics.length;
        const overlap = Math.min(existingTopics.length, incomingTopics.length);
        for (let i = 0; i < overlap; i++) {
          await tx.courseTopic.update({
            where: { id: existingTopics[i].id },
            data: buildTopicWrite(incomingTopics[i], i + 1),
          });
        }
        for (let i = overlap; i < incomingTopics.length; i++) {
          await tx.courseTopic.create({
            data: { courseId: id, ...buildTopicWrite(incomingTopics[i], i + 1) },
          });
        }
        if (existingTopics.length > incomingTopics.length) {
          const toDelete = existingTopics.slice(incomingTopics.length).map((tp) => tp.id);
          await tx.courseTopic.deleteMany({ where: { id: { in: toDelete } } });
        }
      }
      return course;
    });

    // Progress qayta hisoblash faqat mavzu SONI o'zgargandagina (tartib/kontent
    // maxrajni o'zgartirmaydi). Transaction tashqarisida — o'zi tx ochadi.
    if (topicCountChanged) {
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
