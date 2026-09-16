/**
 * POST /api/teacher/courses/[id]/submit
 * O'qituvchi kursni admin tekshiruviga yuboradi (draft/rejected/revision → submitted).
 * Kurs faqat admin tasdig'idan keyin (moderationStatus=approved) jonli bo'ladi.
 */
import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { CourseNotFoundError } from '@/lib/errors';
import { getCourseReadiness } from '@/lib/course-completeness';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;

    const course = await prisma.course.findFirst({
      where: { id, teacherId: session.sub },
    });
    if (!course) throw new CourseNotFoundError(id);

    // To'liqlik tekshiruvi — chala kurs moderatsiyaga tushmasin. Qoidalar KLIENT
    // muharridagi "tayyorlik ro'yxati" bilan YAGONA manbadан (course-completeness.ts):
    // shu tufayli client tugmasi va server aynan bir xil shartни tekshiradi.
    // Test IXTIYORIY (bu qoidada yo'q).
    const topics = await prisma.courseTopic.findMany({
      where: { courseId: id },
      select: { content: true },
    });
    const readiness = getCourseReadiness({
      title: course.title,
      description: course.description,
      coverImage: course.coverImage,
      topics,
    });

    if (!readiness.hasTopics) {
      return jsonResponse(
        { error: 'Tekshiruvga yuborishdan oldin kamida bitta mavzu qo\'shing', code: 'NO_TOPICS' },
        { status: 400 },
      );
    }

    if (readiness.missing.length > 0) {
      return jsonResponse(
        {
          error: `Tekshiruvga yuborishdan oldin to'ldiring: ${readiness.missing.join(', ')}`,
          code: 'INCOMPLETE_COURSE',
        },
        { status: 400 },
      );
    }

    if (course.moderationStatus === 'submitted' || course.moderationStatus === 'under_review') {
      return jsonResponse(
        { error: 'Bu kurs allaqachon tekshiruvda', code: 'ALREADY_SUBMITTED' },
        { status: 400 },
      );
    }
    if (course.moderationStatus === 'approved') {
      return jsonResponse(
        { error: 'Bu kurs allaqachon tasdiqlangan', code: 'ALREADY_APPROVED' },
        { status: 400 },
      );
    }

    const updated = await prisma.course.update({
      where: { id },
      data: {
        moderationStatus: 'submitted',
        isPublished: false,
        adminFeedback: null,
      },
    });

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
