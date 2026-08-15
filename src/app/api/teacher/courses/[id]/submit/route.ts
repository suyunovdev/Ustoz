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

    // Kamida bitta mavzu bo'lishi shart
    const topicCount = await prisma.courseTopic.count({ where: { courseId: id } });
    if (topicCount === 0) {
      return jsonResponse(
        { error: 'Tekshiruvga yuborishdan oldin kamida bitta mavzu qo\'shing', code: 'NO_TOPICS' },
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
