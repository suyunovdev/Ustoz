import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/tests/[id] — test va savollarni olish (autentifikatsiya talab qilinadi)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  const { id } = await params;

  const test = await prisma.courseTest.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { questionOrder: 'asc' } },
    },
  });

  if (!test) {
    return jsonResponse({ error: 'Test topilmadi' }, { status: 404 });
  }

  return jsonResponse({
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      passingScore: test.passingScore,
      courseId: test.courseId,
      questions: test.questions.map((q) => ({
        id: q.id,
        questionOrder: q.questionOrder,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        // correctAnswer client'ga yuborilmasligi kerak — server tomonida tekshiramiz
      })),
    },
  });
}
