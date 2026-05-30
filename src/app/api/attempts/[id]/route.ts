/**
 * GET /api/attempts/[id]
 *
 * Talaba o'z urinishini ko'rishi (natija sahifasida).
 * Submitted bo'lsa — javoblar + to'g'ri javoblar (test.showCorrectAnswers bo'lsa).
 * Auth: faqat o'z urinishi.
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

    const attempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: { include: { questions: { orderBy: { questionOrder: 'asc' } } } },
      },
    });

    if (!attempt) {
      return jsonResponse({ error: "Urinish topilmadi", code: 'ATTEMPT_NOT_FOUND' }, { status: 404 });
    }

    const isOwner = attempt.studentId === session.sub;
    const isTeacher = attempt.test.teacherId === session.sub;
    if (!isOwner && !isTeacher && session.role !== 'admin') {
      return jsonResponse({ error: "Ruxsat yo'q", code: 'TEST_ACCESS_DENIED' }, { status: 403 });
    }

    const showCorrect = attempt.test.showCorrectAnswers || isTeacher || session.role === 'admin';

    const answers = (attempt.answers as Record<string, string | string[]>) || {};
    const results = attempt.test.questions.map((q) => {
      const a = answers[q.id];
      const options = Array.isArray(q.options) ? (q.options as { text: string; isCorrect: boolean }[]) : [];
      const correctAnswersJson = Array.isArray(q.correctAnswers) ? (q.correctAnswers as string[]) : [];

      let correct = false;
      switch (q.questionType) {
        case 'single':
          correct = typeof a === 'string' && options.some((o) => o.isCorrect && o.text === a);
          break;
        case 'multiple': {
          const correctSet = new Set(options.filter((o) => o.isCorrect).map((o) => o.text));
          const givenSet = new Set(Array.isArray(a) ? a : typeof a === 'string' ? [a] : []);
          correct =
            correctSet.size === givenSet.size &&
            Array.from(correctSet).every((x) => givenSet.has(x));
          break;
        }
        case 'true_false':
          correct =
            typeof a === 'string' && correctAnswersJson[0]?.toLowerCase() === a.toLowerCase();
          break;
        case 'text': {
          const norm = typeof a === 'string' ? a.trim().toLowerCase() : '';
          correct = correctAnswersJson.some((c) => c.trim().toLowerCase() === norm);
          break;
        }
      }

      return {
        questionId: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        questionOrder: q.questionOrder,
        points: q.points,
        userAnswer: a ?? null,
        correct,
        pointsEarned: correct ? q.points : 0,
        correctAnswer: showCorrect
          ? q.questionType === 'single' || q.questionType === 'multiple'
            ? options.filter((o) => o.isCorrect).map((o) => o.text)
            : correctAnswersJson
          : null,
        options: showCorrect
          ? options
          : Array.isArray(q.options)
          ? options.map((o) => ({ text: o.text }))
          : null,
        explanation: showCorrect ? q.explanation : null,
      };
    });

    return jsonResponse({
      attempt: {
        id: attempt.id,
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        passed: attempt.passed,
        status: attempt.status,
      },
      test: {
        id: attempt.test.id,
        title: attempt.test.title,
        passingScore: attempt.test.passingScore,
        totalPoints: attempt.test.totalPoints,
      },
      results,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
