import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// POST /api/courses/[id]/enroll — Kursga yozilish (bepul kurslar uchun)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const { id: courseId } = await params;

  const course = await prisma.course.findFirst({ where: { id: courseId, isPublished: true } });
  if (!course) return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });

  // Pulliq kurslar uchun to'lov talab qilinadi
  if (Number(course.priceUzs) > 0) {
    return jsonResponse(
      { error: 'Bu kurs pullik. Avval to\'lov qiling.' },
      { status: 400 }
    );
  }

  // Allaqachon enrolled ekanini tekshirish
  const existing = await prisma.enrollment.findFirst({
    where: { studentId: session.sub, courseId },
  });
  if (existing) return jsonResponse({ message: 'Allaqachon yozilgansiz' });

  const enrollment = await prisma.enrollment.create({
    data: { studentId: session.sub, courseId },
  });

  // enrollmentCount yangilash
  await prisma.course.update({
    where: { id: courseId },
    data: { enrollmentCount: { increment: 1 } },
  });

  return jsonResponse({ enrollment }, { status: 201 });
}
