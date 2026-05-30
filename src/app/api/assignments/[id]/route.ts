/**
 * GET /api/assignments/[id]
 * Talaba (enrolled) yoki teacher (owner) ko'rishi mumkin.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const a = await prisma.assignment.findUnique({
      where: { id },
      include: { course: { select: { id: true, title: true, teacherId: true } } },
    });
    if (!a) {
      return jsonResponse({ error: "Vazifa topilmadi", code: 'ASSIGNMENT_NOT_FOUND' }, { status: 404 });
    }

    const isTeacher = a.course.teacherId === session.sub;
    const isAdmin = session.role === 'admin';

    if (!isTeacher && !isAdmin) {
      if (a.status !== 'published') {
        return jsonResponse(
          { error: "Vazifa hali e'lon qilinmagan", code: 'ASSIGNMENT_NOT_PUBLISHED' },
          { status: 403 },
        );
      }
      const enrolled = await prisma.enrollment.findFirst({
        where: { courseId: a.courseId, studentId: session.sub },
        select: { id: true },
      });
      if (!enrolled) {
        return jsonResponse({ error: "Kursga yozilmagansiz", code: 'NOT_ENROLLED' }, { status: 403 });
      }
    }

    return jsonResponse({
      assignment: {
        id: a.id,
        courseId: a.courseId,
        courseTitle: a.course.title,
        topicId: a.topicId,
        title: a.title,
        description: a.description,
        instructions: a.instructions,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        fileRequirements: a.fileRequirements,
        submissionType: a.submissionType,
        status: a.status,
        allowLateSubmission: a.allowLateSubmission,
        latePenaltyPercent: a.latePenaltyPercent,
        createdAt: a.createdAt,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
