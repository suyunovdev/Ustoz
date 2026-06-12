// @ts-nocheck
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// POST /api/tests/[id]/submit — javoblarni topshirish, natija qaytarish va saqlash
// Body: { answers: { questionId: string, answer: 'A'|'B'|'C'|'D' }[], courseId?: string }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  const { id: testId } = await params;
  const { answers = [], courseId } = await req.json();

  const test = await prisma.courseTest.findUnique({
    where: { id: testId },
    include: { questions: true },
  });
  if (!test) {
    return jsonResponse({ error: 'Test topilmadi' }, { status: 404 });
  }

  const questionById = new Map(test.questions.map((q) => [q.id, q]));
  let correctCount = 0;
  const details = answers.map((a: any) => {
    const q = questionById.get(a.questionId);
    const isCorrect = !!q && q.correctAnswer === a.answer;
    if (isCorrect) correctCount++;
    return {
      questionId: a.questionId,
      submittedAnswer: a.answer,
      correctAnswer: q?.correctAnswer || null,
      isCorrect,
      explanation: q?.explanation || null,
    };
  });

  const totalQuestions = test.questions.length;
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const passed = percentage >= (test.passingScore || 80);

  const cid = courseId || test.courseId || '';
  const passingThreshold = test.passingScore || 80;

  // Avval shu test bo'yicha allaqachon passed urinish bormi tekshirish
  // (bypass'ni oldini olish — bir testni 10 marta passlab progress'ni 100%'ga ko'tarib bo'lmasin)
  const alreadyPassed = passed
    ? await prisma.quizCompletion.findFirst({
        where: {
          studentId: session.sub,
          quizId: testId,
          percentage: { gte: passingThreshold },
        },
        select: { id: true },
      })
    : null;

  // Quiz completion'ni saqlash (har urinish saqlanadi)
  await prisma.quizCompletion.create({
    data: {
      studentId: session.sub,
      courseId: cid,
      quizId: testId,
      score: correctCount,
      maxScore: totalQuestions,
      percentage,
    },
  });

  // Progress oshirilsin — faqat BIRINCHI passed urinishda
  if (passed && !alreadyPassed && cid) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: session.sub, courseId: cid },
    });
    if (enrollment) {
      const newProgress = Math.min((enrollment.progress || 0) + 10, 100);
      if (newProgress > enrollment.progress) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: {
            progress: newProgress,
            completedAt: newProgress === 100 ? new Date() : enrollment.completedAt,
          },
        });
      }
    }
  }

  return jsonResponse({
    score: correctCount,
    maxScore: totalQuestions,
    percentage,
    passed,
    passingScore: test.passingScore,
    details,
  });
}
