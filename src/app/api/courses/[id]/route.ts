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
    where: { id },
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

  // Tasdiqlanmagan / nashr qilinmagan kursni FAQAT egasi, admin yoki
  // allaqachon yozilgan (pul to'lagan) talaba ko'ra oladi. Aks holda 404.
  // Bu moderatsiya tufayli tahrirlanayotgan kursni pul to'lagan talabalar
  // yo'qotmasligini ta'minlaydi.
  const isOwner = !!session && course.teacherId === session.sub;
  const isAdmin = session?.role === 'admin';
  if (!course.isPublished && !isEnrolled && !isOwner && !isAdmin) {
    return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });
  }

  // Kontent himoyasi: pullik mavzuning matni va video havolasi (asosiy pullik
  // aktiv) faqat yozilgan talaba / muallif / admin uchun. Yozilmagan foydalanuvchi
  // kurriculum ro'yxatini (sarlavha, davomiylik, tartib) ko'radi, lekin
  // `content`/`videoUrl` yashiriladi — `isFreePreview` mavzular bundan mustasno
  // (ular ataylab bepul namuna sifatida ochiq).
  const hasFullAccess = isEnrolled || isOwner || isAdmin;
  const topics = course.topics.map((tp) =>
    hasFullAccess || tp.isFreePreview
      ? tp
      : { ...tp, content: '', videoUrl: null },
  );

  return jsonResponse({
    course: {
      ...course,
      topics,
      priceUzs: course.priceUzs.toString(),
      priceUsd: course.priceUsd.toString(),
      enrollmentCount: course.enrollmentCount,
      isEnrolled,
    },
  });
}
