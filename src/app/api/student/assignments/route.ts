/**
 * GET /api/student/assignments
 * Talabaning topshiriqlari (student dashboard uchun).
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse, serializeData } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);

    // Talabaning enrolled kurslaridagi published assignmentlar
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: session.sub, isActive: true },
      select: { courseId: true },
    });
    const courseIds = enrollments.map((e) => e.courseId);

    const assignments = await prisma.assignment.findMany({
      where: { courseId: { in: courseIds }, status: 'published' },
      include: {
        course: { select: { title: true } },
        submissions: {
          where: { studentId: session.sub },
          select: { id: true, status: true, grade: true, submittedAt: true },
          take: 1,
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 50,
    });

    return jsonResponse({
      assignments: serializeData(
        assignments.map((a) => ({
          id: a.id,
          title: a.title,
          courseTitle: a.course.title,
          courseId: a.courseId,
          dueDate: a.dueDate.toISOString(),
          maxScore: a.maxScore,
          submissionType: a.submissionType,
          submission: a.submissions[0] ?? null,
        }))
      ),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
