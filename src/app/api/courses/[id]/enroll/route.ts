import { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';
import { hasAllCoursesAccess } from '@/lib/services/subscription.service';

// POST /api/courses/[id]/enroll — Kursga yozilish (bepul kurslar uchun)
// Faqat student roli — teacher/admin bepul kursga yozila olmaydi
// (xohlasalar, alohida student account ochishlari kerak).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireStudent(req);
  } catch (err) {
    return errorResponse(err);
  }

  const { id: courseId } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId)) {
    return jsonResponse({ error: "Noto'g'ri kurs ID formati" }, { status: 400 });
  }

  const course = await prisma.course.findFirst({ where: { id: courseId, isPublished: true } });
  if (!course) return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });

  // Pullik kurslar uchun to'lov talab qilinadi — LEKIN faol all-access obunachi
  // istalgan kursga bepul yozila oladi (obuna kurs narxini qoplaydi).
  if (Number(course.priceUzs) > 0) {
    const subscribed = await hasAllCoursesAccess(session.sub);
    if (!subscribed) {
      return jsonResponse(
        { error: 'Bu kurs pullik. Avval to\'lov qiling yoki obuna bo\'ling.', code: 'PAYMENT_REQUIRED' },
        { status: 400 }
      );
    }
    // obunachi → bepul davom etadi
  }

  // Enrollment yaratish + counter inkrementi — atomik.
  // Refund'dan keyin qayta enrollment qilingan holatda counter ikki marta oshmaydi.
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Race-safe: atomik updateMany/createMany ishlatamiz. Ikki bir vaqtli
      // so'rov ham counter'ni faqat BIR marta oshiradi (o'zgargan qatorlar
      // soniga qarab), chunki updateMany/createMany atomik.

      // 1) Noaktiv (refund'dan keyin) enrollment'ni reaktivatsiya
      const reactivated = await tx.enrollment.updateMany({
        where: { studentId: session.sub, courseId, isActive: false },
        data: { isActive: true },
      });
      if (reactivated.count > 0) {
        await tx.course.update({
          where: { id: courseId },
          data: { enrollmentCount: { increment: reactivated.count } },
        });
        const enrollment = await tx.enrollment.findUnique({
          where: { studentId_courseId: { studentId: session.sub, courseId } },
        });
        return { enrollment, alreadyEnrolled: false as const };
      }

      // 2) Yangi enrollment — skipDuplicates concurrent create'ni xavfsiz qiladi
      const created = await tx.enrollment.createMany({
        data: [{ studentId: session.sub, courseId, isActive: true }],
        skipDuplicates: true,
      });
      const enrollment = await tx.enrollment.findUnique({
        where: { studentId_courseId: { studentId: session.sub, courseId } },
      });
      if (created.count > 0) {
        await tx.course.update({
          where: { id: courseId },
          data: { enrollmentCount: { increment: created.count } },
        });
        return { enrollment, alreadyEnrolled: false as const };
      }

      // 3) Hech narsa o'zgarmadi → allaqachon faol edi (concurrent yoki oldindan)
      return { enrollment, alreadyEnrolled: true as const };
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
