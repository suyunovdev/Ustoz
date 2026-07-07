/**
 * GET /api/enrollments/[courseId]/progress
 * Kurs bo'yicha progress ma'lumoti (learning interface uchun).
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { topicCompletionRepo } from '@/lib/repositories';
import { computeProgressForEnrollments } from '@/lib/services/dashboard-progress.helper';
import type { CourseProgressResponse } from '@/types/dashboard.types';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await requireStudent(req);
    const { courseId } = await params;

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.sub, courseId } },
      select: { progress: true, completedAt: true, isActive: true },
    });

    if (!enrollment || !enrollment.isActive) {
      return jsonResponse({ error: 'Enrollment topilmadi' }, { status: 404 });
    }

    const completedIds = await topicCompletionRepo.getCompletedTopicIds(session.sub, courseId);
    const meta = await computeProgressForEnrollments(session.sub, [{ courseId }]);
    const progressMeta = meta.get(courseId);

    const response: CourseProgressResponse = {
      courseId,
      progress: enrollment.progress,
      completedTopicIds: Array.from(completedIds),
      nextTopic: progressMeta?.nextTopic ?? null,
      isCompleted: enrollment.progress >= 100,
      completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
    };

    return jsonResponse(response);
  } catch (err) {
    return errorResponse(err);
  }
}
