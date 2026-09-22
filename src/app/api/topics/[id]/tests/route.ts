/**
 * GET /api/topics/[id]/tests
 * O'quv interfeysi uchun mavzuning PUBLISHED testlari + talabaning natijasi.
 *
 * Kirish huquqi: admin, kurs egasi (teacher), yoki shu kursga faol yozilgan talaba.
 * Faqat status='published' testlar qaytadi. Javob kaliti (to'g'ri javoblar) qaytmaydi.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { hasActiveCourseAccess } from '@/lib/services/subscription.service';
import { testRepo } from '@/lib/repositories';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id: topicId } = await params;

    const topic = await prisma.courseTopic.findUnique({
      where: { id: topicId },
      select: { id: true, courseId: true, course: { select: { teacherId: true } } },
    });
    if (!topic) {
      return jsonResponse({ error: 'Mavzu topilmadi' }, { status: 404 });
    }

    // Kirish huquqi: admin, kurs egasi teacher, yoki faol enrollment'li talaba.
    const isAdmin = session.role === 'admin';
    const isOwnerTeacher = session.role === 'teacher' && topic.course?.teacherId === session.sub;
    let allowed = isAdmin || isOwnerTeacher;
    if (!allowed) {
      allowed = await hasActiveCourseAccess(session.sub, topic.courseId);
    }
    if (!allowed) {
      return jsonResponse({ error: 'Bu testlarga kirish huquqingiz yo\'q' }, { status: 403 });
    }

    const published = await testRepo.listPublishedTestsByTopic(topicId);

    // Har test uchun talabaning urinishlari + eng yaxshi natijasi.
    const tests = await Promise.all(
      published.map(async (tst) => {
        const [attemptsUsed, attempts] = await Promise.all([
          testRepo.countAttempts(tst.id, session.sub),
          testRepo.listStudentAttempts(tst.id, session.sub),
        ]);
        const submitted = attempts.filter((a) => a.status === 'submitted');
        const best = submitted.reduce<{ percentage: number; passed: boolean } | null>(
          (acc, a) => {
            const pct = Number(a.percentage);
            if (!acc || pct > acc.percentage) return { percentage: pct, passed: a.passed };
            return acc;
          },
          null,
        );
        return {
          id: tst.id,
          title: tst.title,
          description: tst.description,
          questionCount: tst.questionCount,
          passingScore: tst.passingScore,
          timeLimitSec: tst.timeLimitSec,
          allowedAttempts: tst.allowedAttempts,
          attemptsUsed,
          bestAttempt: best,
        };
      }),
    );

    return jsonResponse({ tests });
  } catch (err) {
    return errorResponse(err);
  }
}
