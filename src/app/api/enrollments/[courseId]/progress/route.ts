/**
 * GET /api/enrollments/[courseId]/progress
 *
 * Bitta kurs uchun student progress'i — to'liq detail.
 * Learning interface va Continue Learning card uchun.
 *
 * Auth: JWT
 *
 * Response:
 *   200 {
 *     courseId: string,
 *     progress: number,                 // 0-100
 *     completedTopicIds: string[],
 *     nextTopic: { id, title, orderIndex } | null,
 *     isCompleted: boolean,             // progress === 100
 *     completedAt: string | null        // ISO date yoki null
 *   }
 *   401 — Auth yo'q
 *   403 — Kursga yozilmagan
 *   500 — Server xatosi
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import {
  calculateCourseProgress,
  getCompletedTopicIds,
  getNextTopic,
} from '@/lib/services/progress.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse(
      { error: 'Autentifikatsiya talab qilinadi' },
      { status: 401 },
    );
  }

  const { courseId } = await params;

  try {
    // Enrollment tekshirish (yozilganmi?)
    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.sub, courseId } },
      select: { completedAt: true, isActive: true },
    });
    if (!enrollment) {
      return jsonResponse(
        { error: "Siz bu kursga yozilmagansiz" },
        { status: 403 },
      );
    }

    // 3 ta parallel chaqiruv (har biri o'zining indekslaridan foydalanadi)
    const [progress, completedSet, nextTopic] = await Promise.all([
      calculateCourseProgress(session.sub, courseId),
      getCompletedTopicIds(session.sub, courseId),
      getNextTopic(session.sub, courseId),
    ]);

    return jsonResponse({
      courseId,
      progress,
      completedTopicIds: Array.from(completedSet),
      nextTopic,
      isCompleted: progress === 100,
      completedAt: enrollment.completedAt ? enrollment.completedAt.toISOString() : null,
    });
  } catch (err) {
    console.error('[GET /api/enrollments/[courseId]/progress]', err);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
