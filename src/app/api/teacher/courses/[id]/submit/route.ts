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

    // To'liqlik tekshiruvi — chala kurs moderatsiyaga tushmasin. Bu tekshiruv
    // SERVER tomonida majburlanadi (ilgari faqat client checklist edi — dekorativ:
    // muqovasiz/testsiz kurs 200 olardi). Client tugmasi ham shu shartlarga bog'landi.
    const missing: string[] = [];
    if (!course.title || course.title.trim().length < 3) missing.push('nom (kamida 3 belgi)');
    if (!course.description || course.description.trim().length < 10) missing.push('tavsif (kamida 10 belgi)');
    if (!course.coverImage || !course.coverImage.trim()) missing.push('muqova rasmi');

    // Mavzular — kamida bitta, har birida dars matni, va kamida bitta mavzuda test.
    const topics = await prisma.courseTopic.findMany({
      where: { courseId: id },
      select: { content: true, hasQuiz: true },
    });
    if (topics.length === 0) {
      return jsonResponse(
        { error: 'Tekshiruvga yuborishdan oldin kamida bitta mavzu qo\'shing', code: 'NO_TOPICS' },
        { status: 400 },
      );
    }
    const emptyContentCount = topics.filter((tp) => !tp.content || !tp.content.trim()).length;
    if (emptyContentCount > 0) missing.push(`${emptyContentCount} ta mavzuda dars matni yo'q`);
    if (!topics.some((tp) => tp.hasQuiz)) missing.push('kamida bitta mavzuda 5+ savolli test');

    if (missing.length > 0) {
      return jsonResponse(
        {
          error: `Tekshiruvga yuborishdan oldin to'ldiring: ${missing.join(', ')}`,
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
