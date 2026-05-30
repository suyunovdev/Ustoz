/**
 * Teacher repository — teacher dashboard uchun ixtisoslashtirilgan query'lar.
 *
 * Biznes logikasi YO'Q. Faqat Prisma query'lar.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const teacherCourseInclude = {
  categoryRel: { select: { id: true, name: true, slug: true } },
  _count: { select: { enrollments: true, reviews: true, topics: true } },
} satisfies Prisma.CourseInclude;

export type TeacherCourseRow = Prisma.CourseGetPayload<{
  include: typeof teacherCourseInclude;
}>;

export interface TeacherCourseWithRevenue extends TeacherCourseRow {
  revenueUzs: string;
}

export interface TeacherCourseFilters {
  status?: 'all' | 'published' | 'draft' | 'rejected' | 'under_review';
  search?: string;
}

/**
 * Teacher'ning barcha kurslari + har birining daromadi.
 * Daromad: courses LEFT JOIN payment_transactions (status=completed)
 *
 * Bitta raw SQL bilan barcha kurslar + revenue qaytaradi (N+1 yo'q).
 */
export async function findCoursesWithRevenue(
  teacherId: string,
  filters: TeacherCourseFilters = {},
): Promise<TeacherCourseWithRevenue[]> {
  const courses = await prisma.course.findMany({
    where: {
      teacherId,
      ...(filters.status === 'published' ? { isPublished: true } : {}),
      ...(filters.status === 'draft' ? { moderationStatus: 'draft' } : {}),
      ...(filters.status === 'rejected' ? { moderationStatus: 'rejected' } : {}),
      ...(filters.status === 'under_review'
        ? { moderationStatus: { in: ['submitted', 'under_review'] } }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    include: teacherCourseInclude,
    orderBy: { createdAt: 'desc' },
  });

  if (courses.length === 0) return [];

  // Bitta query bilan barcha kurslar uchun revenue
  const courseIds = courses.map((c) => c.id);
  const revenueRows = await prisma.paymentTransaction.groupBy({
    by: ['courseId'],
    where: { courseId: { in: courseIds }, status: 'completed' },
    _sum: { amountUzs: true },
  });
  const revenueByCourse = new Map<string, bigint>();
  for (const r of revenueRows) {
    revenueByCourse.set(r.courseId, r._sum.amountUzs ?? BigInt(0));
  }

  return courses.map((c) => ({
    ...c,
    revenueUzs: (revenueByCourse.get(c.id) ?? BigInt(0)).toString(),
  }));
}

export async function findCourseByIdForTeacher(
  courseId: string,
  teacherId: string,
): Promise<TeacherCourseWithRevenue | null> {
  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId },
    include: teacherCourseInclude,
  });
  if (!course) return null;

  const agg = await prisma.paymentTransaction.aggregate({
    where: { courseId, status: 'completed' },
    _sum: { amountUzs: true },
  });
  return {
    ...course,
    revenueUzs: (agg._sum.amountUzs ?? BigInt(0)).toString(),
  };
}

/**
 * Kursni o'chirish — faqat o'z kursi va enrollment yo'q bo'lsa.
 */
export async function deleteCourseSafe(
  courseId: string,
  teacherId: string,
  tx?: Prisma.TransactionClient,
): Promise<{ deleted: boolean; reason?: string }> {
  const client: PrismaLike = tx ?? prisma;
  const course = await client.course.findFirst({
    where: { id: courseId, teacherId },
    include: { _count: { select: { enrollments: true } } },
  });
  if (!course) return { deleted: false, reason: 'Kurs topilmadi' };
  if (course._count.enrollments > 0) {
    return {
      deleted: false,
      reason: "Kurs talabalarga sotilgan — o'chirib bo'lmaydi (arxivlang)",
    };
  }
  await client.course.delete({ where: { id: courseId } });
  return { deleted: true };
}

export async function updateArchiveStatus(
  courseId: string,
  teacherId: string,
  isPublished: boolean,
  tx?: Prisma.TransactionClient,
): Promise<TeacherCourseRow | null> {
  const client: PrismaLike = tx ?? prisma;
  // Faqat o'z kursi
  const exists = await client.course.findFirst({
    where: { id: courseId, teacherId },
    select: { id: true },
  });
  if (!exists) return null;
  return client.course.update({
    where: { id: courseId },
    data: { isPublished, ...(isPublished ? { publishedAt: new Date() } : {}) },
    include: teacherCourseInclude,
  });
}

/**
 * Duplicate course — barcha topic'lar bilan birga.
 * Status: draft, isPublished: false.
 * Subject va target audience same.
 */
export async function duplicateCourse(
  courseId: string,
  teacherId: string,
  tx?: Prisma.TransactionClient,
): Promise<TeacherCourseRow | null> {
  const client: PrismaLike = tx ?? prisma;
  const source = await client.course.findFirst({
    where: { id: courseId, teacherId },
    include: { topics: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!source) return null;

  const created = await client.course.create({
    data: {
      teacherId,
      title: `${source.title} (nusxa)`,
      description: source.description,
      category: source.category,
      categoryId: source.categoryId,
      targetAudience: source.targetAudience,
      subjectCategory: source.subjectCategory,
      gradeLevel: source.gradeLevel,
      priceUsd: source.priceUsd,
      priceUzs: source.priceUzs,
      coverImage: source.coverImage,
      language: source.language,
      difficultyLevel: source.difficultyLevel,
      totalDuration: source.totalDuration,
      isPublished: false,
      moderationStatus: 'draft',
      topics: {
        create: source.topics.map((t) => ({
          title: t.title,
          content: t.content,
          orderIndex: t.orderIndex,
          duration: t.duration,
          hasQuiz: t.hasQuiz,
        })),
      },
    },
    include: teacherCourseInclude,
  });

  return created;
}
