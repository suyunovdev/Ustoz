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

  // Qo'shimcha ma'lumotlar (kurs tafsiloti sahifasi uchun) — parallel:
  //  1) reyting taqsimoti (haqiqiy, groupBy) — soxta emas
  //  2) o'xshash kurslar (bir yo'nalish, o'zidan tashqari)
  //  3) muallifning boshqa kurslari + jami kursi soni
  const cardSelect = {
    id: true,
    title: true,
    coverImage: true,
    priceUzs: true,
    rating: true,
    reviewCount: true,
    enrollmentCount: true,
    difficultyLevel: true,
    teacher: { select: { fullName: true } },
  } as const;

  const [ratingGroups, relatedRaw, instructorRaw, instructorCourseCount] = await Promise.all([
    prisma.courseReview.groupBy({
      by: ['rating'],
      where: { courseId: id, hiddenAt: null },
      _count: { rating: true },
    }),
    prisma.course.findMany({
      where: {
        isPublished: true,
        id: { not: id },
        subjectCategory: course.subjectCategory,
      },
      select: cardSelect,
      orderBy: [{ enrollmentCount: 'desc' }, { rating: 'desc' }],
      take: 3,
    }),
    prisma.course.findMany({
      where: { isPublished: true, id: { not: id }, teacherId: course.teacherId },
      select: cardSelect,
      orderBy: { enrollmentCount: 'desc' },
      take: 3,
    }),
    prisma.course.count({ where: { isPublished: true, teacherId: course.teacherId } }),
  ]);

  // Reyting taqsimotini 5→1 to'liq to'ldirish (bo'sh darajalar 0)
  const distMap = new Map(ratingGroups.map((g) => [g.rating, g._count.rating]));
  const totalRatings = course.reviewCount || ratingGroups.reduce((a, g) => a + g._count.rating, 0);
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = distMap.get(stars) || 0;
    return {
      stars,
      count,
      percentage: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0,
    };
  });

  const toCard = (c: {
    id: string;
    title: string;
    coverImage: string | null;
    priceUzs: bigint;
    rating: unknown;
    reviewCount: number;
    enrollmentCount: number;
    difficultyLevel: string | null;
    teacher: { fullName: string | null };
  }) => ({
    id: c.id,
    title: c.title,
    // data: muqovalarni ro'yxatga qo'shmaymiz (payload shishmasligi uchun)
    coverImage: c.coverImage?.startsWith('data:') ? null : c.coverImage,
    priceUzs: c.priceUzs.toString(),
    rating: Number(c.rating) || 0,
    reviewCount: c.reviewCount,
    enrollmentCount: c.enrollmentCount,
    difficultyLevel: c.difficultyLevel,
    teacherName: c.teacher.fullName || '',
  });

  return jsonResponse({
    course: {
      ...course,
      topics,
      priceUzs: course.priceUzs.toString(),
      priceUsd: course.priceUsd.toString(),
      enrollmentCount: course.enrollmentCount,
      isEnrolled,
      ratingDistribution,
      relatedCourses: relatedRaw.map(toCard),
      instructorCourses: instructorRaw.map(toCard),
      instructorCourseCount,
    },
  });
}
