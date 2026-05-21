// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/tests
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const tests = await prisma.courseTest.findMany({
    where: { teacherId: session.sub },
    include: {
      course: { select: { title: true } },
      _count: { select: { questions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    tests: tests.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      courseTitle: t.course?.title,
      courseId: t.courseId,
      passingScore: t.passingScore,
      questionCount: t._count.questions,
      moderationStatus: t.moderationStatus,
      createdAt: t.createdAt,
    })),
  });
}

// POST /api/teacher/tests — Test saqlash
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const { testId, title, description, courseId, passingScore = 80, questions } = await req.json();

  if (!title || !questions?.length) {
    return NextResponse.json({ error: 'Sarlavha va savollar majburiy' }, { status: 400 });
  }

  // Savollarni tekshirish
  for (const q of questions) {
    if (!q.questionText || !q.optionA || !q.optionB || !q.optionC || !q.optionD || !q.correctAnswer) {
      return NextResponse.json({ error: 'Barcha savol maydonlari to\'ldirilishi kerak' }, { status: 400 });
    }
    if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
      return NextResponse.json({ error: 'To\'g\'ri javob A, B, C yoki D bo\'lishi kerak' }, { status: 400 });
    }
  }

  let test;

  if (testId) {
    // Mavjud testni yangilash
    const existing = await prisma.courseTest.findFirst({
      where: { id: testId, teacherId: session.sub },
    });
    if (!existing) return NextResponse.json({ error: 'Test topilmadi' }, { status: 404 });

    await prisma.testQuestion.deleteMany({ where: { testId } });

    test = await prisma.courseTest.update({
      where: { id: testId },
      data: {
        title,
        description,
        courseId: courseId || null,
        passingScore,
        questions: {
          createMany: {
            data: questions.map((q: any, i: number) => ({
              questionOrder: i + 1,
              questionText: q.questionText,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || null,
            })),
          },
        },
      },
      include: { questions: true },
    });
  } else {
    // Yangi test yaratish
    test = await prisma.courseTest.create({
      data: {
        teacherId: session.sub,
        title,
        description,
        courseId: courseId || null,
        passingScore,
        questions: {
          createMany: {
            data: questions.map((q: any, i: number) => ({
              questionOrder: i + 1,
              questionText: q.questionText,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation || null,
            })),
          },
        },
      },
      include: { questions: true },
    });
  }

  // courseId berilgan bo'lsa — courseTopic.has_quiz yangilash
  if (courseId) {
    await prisma.course.update({
      where: { id: courseId },
      data: {},
    });
  }

  return NextResponse.json({ test }, { status: testId ? 200 : 201 });
}
