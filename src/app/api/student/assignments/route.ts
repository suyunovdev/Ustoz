/**
 * GET /api/student/assignments
 *
 * Talabaning enroll bo'lgan kurslari uchun barcha published vazifalar va o'z topshiriqlari.
 * Mavjud topshiriq holatini birga qaytaradi (status/grade).
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    // Talaba qaysi kurslarga yozilgan
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.sub },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);
    if (courseIds.length === 0) return jsonResponse({ assignments: [] });

    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds }, status: 'published' },
      include: {
        course: { select: { title: true } },
        submissions: {
          where: { studentId: session.sub },
          orderBy: { revisionNumber: 'desc' },
          take: 1,
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    return jsonResponse({
      assignments: assignments.map((a) => {
        const sub = a.submissions[0] ?? null;
        const isOverdue = !sub && a.dueDate < now;
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          courseId: a.courseId,
          courseTitle: a.course.title,
          dueDate: a.dueDate,
          maxScore: a.maxScore,
          submissionType: a.submissionType,
          allowLateSubmission: a.allowLateSubmission,
          isOverdue,
          mySubmission: sub
            ? {
                id: sub.id,
                status: sub.status,
                isLate: sub.isLate,
                submittedAt: sub.submittedAt,
                grade: sub.grade,
                feedback: sub.feedback,
                revisionNumber: sub.revisionNumber,
              }
            : null,
        };
      }),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
