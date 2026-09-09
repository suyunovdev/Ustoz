/**
 * Teacher repository — teacher dashboard uchun ixtisoslashtirilgan query'lar.
 *
 * Biznes logikasi YO'Q. Faqat Prisma query'lar.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { PLATFORM_FEE_PCT } from './earnings.repository';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const teacherCourseInclude = {
  categoryRel: { select: { id: true, name: true, slug: true } },
  _count: { select: { enrollments: true, reviews: true, topics: true } },
} satisfies Prisma.CourseInclude;

export type TeacherCourseRow = Prisma.CourseGetPayload<{
  include: typeof teacherCourseInclude;
}>;

export interface TeacherCourseWithRevenue extends TeacherCourseRow {
  /** Brutto daromad (completed to'lovlar yig'indisi). */
  revenueUzs: string;
  /** Netto daromad — har txn snapshot komissiyasi ayrilgan (balans bilan izchil). */
  netRevenueUzs: string;
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

  // Bitta raw query bilan barcha kurslar uchun brutto + netto (per-txn snapshot fee).
  const courseIds = courses.map((c) => c.id);
  const revenueRows = await prisma.$queryRaw<
    Array<{ courseId: string; gross: bigint; net: bigint }>
  >(Prisma.sql`
    SELECT course_id AS "courseId",
      COALESCE(SUM(amount_uzs), 0)::bigint AS gross,
      COALESCE(SUM(amount_uzs - floor(amount_uzs * COALESCE(platform_fee_pct, ${PLATFORM_FEE_PCT}) / 100.0)), 0)::bigint AS net
    FROM payment_transactions
    WHERE status = 'completed'
      AND course_id IN (${Prisma.join(courseIds.map((id) => Prisma.sql`${id}::uuid`))})
    GROUP BY course_id
  `);
  const grossByCourse = new Map<string, bigint>();
  const netByCourse = new Map<string, bigint>();
  for (const r of revenueRows) {
    grossByCourse.set(r.courseId, r.gross);
    netByCourse.set(r.courseId, r.net);
  }

  return courses.map((c) => ({
    ...c,
    revenueUzs: (grossByCourse.get(c.id) ?? BigInt(0)).toString(),
    netRevenueUzs: (netByCourse.get(c.id) ?? BigInt(0)).toString(),
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

  const rows = await prisma.$queryRaw<Array<{ gross: bigint; net: bigint }>>(Prisma.sql`
    SELECT
      COALESCE(SUM(amount_uzs), 0)::bigint AS gross,
      COALESCE(SUM(amount_uzs - floor(amount_uzs * COALESCE(platform_fee_pct, ${PLATFORM_FEE_PCT}) / 100.0)), 0)::bigint AS net
    FROM payment_transactions
    WHERE status = 'completed' AND course_id = ${courseId}::uuid
  `);
  return {
    ...course,
    revenueUzs: (rows[0]?.gross ?? BigInt(0)).toString(),
    netRevenueUzs: (rows[0]?.net ?? BigInt(0)).toString(),
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
    select: { id: true, moderationStatus: true },
  });
  if (!exists) return null;
  // Moderatsiya himoyasi: kursni FAQAT admin tasdiqlagan bo'lsa jonli qilish
  // mumkin (draft/rejected kursni bu yo'l bilan self-publish qilib bo'lmaydi).
  if (isPublished && exists.moderationStatus !== 'approved') {
    return client.course.update({
      where: { id: courseId },
      data: { isPublished: false },
      include: teacherCourseInclude,
    });
  }
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
        // BARCHA mazmun maydonlari ko'chiriladi — aks holda nusxada video, modul,
        // bepul-preview va qulf bayroqlari yo'qolardi.
        create: source.topics.map((t) => ({
          title: t.title,
          description: t.description,
          content: t.content,
          orderIndex: t.orderIndex,
          duration: t.duration,
          videoUrl: t.videoUrl,
          moduleTitle: t.moduleTitle,
          hasQuiz: t.hasQuiz,
          isFreePreview: t.isFreePreview,
          isLocked: t.isLocked,
        })),
      },
    },
    include: teacherCourseInclude,
  });

  return created;
}
