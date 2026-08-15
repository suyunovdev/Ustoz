import { NextRequest } from 'next/server';

interface SubmittedAnswer {
  questionId: string;
  answer: string;
}
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

  let answers: SubmittedAnswer[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.answers)) answers = body.answers;
  } catch {
    return jsonResponse({ error: "Noto'g'ri so'rov tanasi" }, { status: 400 });
  }

  const test = await prisma.courseTest.findUnique({
    where: { id: testId },
    include: { questions: true },
  });
  if (!test) {
    return jsonResponse({ error: 'Test topilmadi' }, { status: 404 });
  }

  // Kurs testiga faqat shu kursga yozilgan student topshira oladi.
  // Client bergan courseId'ga ISHONMAYMIZ — faqat server'dagi test.courseId.
  // Bu ham javob kalitini oshkor qilishni, ham begona kursga progress farming'ni oldini oladi.
  if (test.courseId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: session.sub, courseId: test.courseId },
      select: { id: true },
    });
    if (!enrollment) {
      return jsonResponse(
        { error: 'Bu testni topshirish uchun kursga yozilishingiz kerak' },
        { status: 403 },
      );
    }
  }

  const questionById = new Map(test.questions.map((q) => [q.id, q]));
  let correctCount = 0;
  const details = answers.map((a: SubmittedAnswer) => {
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
  // 0-savolli test o'tib bo'lmaydi (passingScore 0 bo'lsa ham)
  const passed = totalQuestions > 0 && percentage >= (test.passingScore || 80);

  const cid = test.courseId || '';
  const passingThreshold = test.passingScore || 80;

  // Quiz completion'ni saqlash (har urinish saqlanadi).
  // courseId majburiy uuid — kursga bog'liq bo'lmagan (standalone) test bo'lsa saqlamaymiz.
  if (cid) {
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
  }

  // MUHIM: test natijasi FAQAT hisobot uchun (quiz_completions'ga yoziladi).
  // Ilgari har o'tgan test enrollment.progress'ni +10 qilardi — bu mavzularni
  // tugatmasdan 100% ga yetish va "mehnatsiz sertifikat" olish yo'lini ochardi.
  // Progress endi FAQAT mavzu tugatish (markTopicComplete) orqali o'zgaradi.

  return jsonResponse({
    score: correctCount,
    maxScore: totalQuestions,
    percentage,
    passed,
    passingScore: test.passingScore,
    details,
  });
}
