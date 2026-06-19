import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/courses/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return jsonResponse({ error: "Noto'g'ri ID formati" }, { status: 400 });
  }
  const session = await getSessionFromRequest(req);

  const course = await prisma.course.findFirst({
    where: { id, isPublished: true },
    include: {
      teacher: { select: { id: true, fullName: true, avatarUrl: true, bio: true } },
      topics: { orderBy: { orderIndex: 'asc' } },
      reviews: {
        include: { student: { select: { fullName: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: { select: { enrollments: true } },
    },
  });

  if (!course) {
    return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });
  }

  // O'quvchi enrolled ekanini tekshirish
  let isEnrolled = false;
  if (session) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: session.sub, courseId: id },
    });
    isEnrolled = !!enrollment;
  }

  return jsonResponse({
    course: {
      ...course,
      priceUzs: course.priceUzs.toString(),
      priceUsd: course.priceUsd.toString(),
      enrollmentCount: course._count.enrollments,
      isEnrolled,
    },
  });
}
