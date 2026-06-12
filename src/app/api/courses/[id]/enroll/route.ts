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

  // Enrollment yaratish + counter inkrementi — atomik.
  // Refund'dan keyin qayta enrollment qilingan holatda counter ikki marta oshmaydi.
  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.enrollment.findUnique({
        where: { studentId_courseId: { studentId: session.sub, courseId } },
        select: { id: true, isActive: true },
      });

      // Allaqachon faol enrollment bor — hech narsa qilmaymiz
      if (existing?.isActive) {
        return { enrollment: existing, alreadyEnrolled: true as const };
      }

      // Yangi yoki noaktiv (refund'dan keyin) — upsert
      const enrollment = await tx.enrollment.upsert({
        where: { studentId_courseId: { studentId: session.sub, courseId } },
        create: { studentId: session.sub, courseId, isActive: true },
        update: { isActive: true },
      });

      // Faqat yangi yoki reaktivatsiya holatida counter oshadi
      await tx.course.update({
        where: { id: courseId },
        data: { enrollmentCount: { increment: 1 } },
      });

      return { enrollment, alreadyEnrolled: false as const };
    });

    if (result.alreadyEnrolled) {
      return jsonResponse({ message: 'Allaqachon yozilgansiz', enrollment: result.enrollment });
    }
    return jsonResponse({ enrollment: result.enrollment }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/courses/[id]/enroll]', err);
    return jsonResponse({ error: 'Yozilishda xato yuz berdi' }, { status: 500 });
  }
}
