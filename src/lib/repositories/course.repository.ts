/**
 * Course repository — `courses` jadvali uchun.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma, ModerationStatus } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const courseInclude = {
  categoryRel: { select: { id: true, name: true, slug: true } },
  teacher: { select: { fullName: true } },
} satisfies Prisma.CourseInclude;

export type CourseWithCategoryAndTeacher = Prisma.CourseGetPayload<{
  include: typeof courseInclude;
}>;

const adminCourseInclude = {
  categoryRel: { select: { id: true, name: true, slug: true } },
  teacher: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
  _count: { select: { enrollments: true, topics: true, reviews: true } },
} satisfies Prisma.CourseInclude;

export type CourseWithAdminInfo = Prisma.CourseGetPayload<{
  include: typeof adminCourseInclude;
}>;

export async function findPublishedByCategoriesExcluding(
  categoryIds: string[],
  excludeIds: string[],
  take: number,
  options?: { minRating?: number },
): Promise<CourseWithCategoryAndTeacher[]> {
  if (categoryIds.length === 0) return [];
  return prisma.course.findMany({
    where: {
      isPublished: true,
      categoryId: { in: categoryIds },
      id: { notIn: excludeIds },
      ...(options?.minRating ? { rating: { gte: options.minRating } } : {}),
    },
    orderBy: [{ rating: 'desc' }, { enrollmentCount: 'desc' }],
    take,
    include: courseInclude,
  });
}

export async function findPublishedExcludingCategories(
  excludeCategoryIds: string[],
  excludeIds: string[],
  take: number,
): Promise<CourseWithCategoryAndTeacher[]> {
  return prisma.course.findMany({
    where: {
      isPublished: true,
      id: { notIn: excludeIds },
      ...(excludeCategoryIds.length > 0
        ? { categoryId: { notIn: excludeCategoryIds } }
        : {}),
    },
    orderBy: [{ rating: 'desc' }, { enrollmentCount: 'desc' }],
    take,
    include: courseInclude,
  });
}

export async function findRecentPublished(
  sinceDate: Date,
  excludeIds: string[],
  take: number,
): Promise<CourseWithCategoryAndTeacher[]> {
  return prisma.course.findMany({
    where: {
      isPublished: true,
      id: { notIn: excludeIds },
      createdAt: { gte: sinceDate },
    },
    orderBy: { createdAt: 'desc' },
    take,
    include: courseInclude,
  });
}

export async function findTopRatedPublished(
  excludeIds: string[],
  take: number,
  options?: { minRating?: number },
): Promise<CourseWithCategoryAndTeacher[]> {
  return prisma.course.findMany({
    where: {
      isPublished: true,
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
      ...(options?.minRating ? { rating: { gte: options.minRating } } : {}),
    },
    orderBy: [
      { rating: 'desc' },
      { enrollmentCount: 'desc' },
      { createdAt: 'desc' },
    ],
    take,
    include: courseInclude,
  });
}

/**
 * IDs bo'yicha topish (similar courses uchun — order saqlanmaydi, caller sort qilishi kerak).
 */
export async function findByIds(ids: string[]): Promise<CourseWithCategoryAndTeacher[]> {
  if (ids.length === 0) return [];
  return prisma.course.findMany({
    where: { id: { in: ids } },
    include: courseInclude,
  });
}

/**
 * Collaborative filtering — "Bu kursni o'qiganlar shularni ham o'qiydi".
 * Self-join SQL: Prisma helper'larsiz qilib bo'lmaydi.
 */
export async function findSimilarByEnrollment(
  courseId: string,
  limit = 4,
): Promise<Array<{ id: string; overlap: bigint }>> {
  return prisma.$queryRaw<Array<{ id: string; overlap: bigint }>>`
    SELECT c.id, COUNT(*) AS overlap
    FROM enrollments e1
    JOIN enrollments e2 ON e1.student_id = e2.student_id
    JOIN courses c ON e2.course_id = c.id
    WHERE e1.course_id = ${courseId}::uuid
      AND e2.course_id != ${courseId}::uuid
      AND c.is_published = true
    GROUP BY c.id
    ORDER BY overlap DESC
    LIMIT ${limit}
  `;
}

// ─── Admin queries ─────────────────────────────────────────────────────────

export interface AdminCourseFilters {
  status?: ModerationStatus | 'all';
  search?: string;
  featuredOnly?: boolean;
  suspendedOnly?: boolean;
  limit?: number;
  cursor?: string | null;
}

export async function findAllForAdmin(
  filters: AdminCourseFilters = {},
): Promise<CourseWithAdminInfo[]> {
  const {
    status,
    search,
    featuredOnly,
    suspendedOnly,
    limit = 20,
    cursor,
  } = filters;

  const where: Prisma.CourseWhereInput = {
    ...(status && status !== 'all' ? { moderationStatus: status } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(featuredOnly ? { isFeatured: true } : {}),
    ...(suspendedOnly ? { suspendedAt: { not: null } } : {}),
  };

  return prisma.course.findMany({
    where,
    include: adminCourseInclude,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // +1 — hasMore aniqlash
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function countForAdmin(
  filters: Pick<AdminCourseFilters, 'status' | 'search' | 'featuredOnly' | 'suspendedOnly'> = {},
): Promise<number> {
  return prisma.course.count({
    where: {
      ...(filters.status && filters.status !== 'all'
        ? { moderationStatus: filters.status }
        : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.featuredOnly ? { isFeatured: true } : {}),
      ...(filters.suspendedOnly ? { suspendedAt: { not: null } } : {}),
    },
  });
}

export async function statusCountsForAdmin(): Promise<{
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  revision_requested: number;
  featured: number;
  suspended: number;
}> {
  const grouped = await prisma.course.groupBy({
    by: ['moderationStatus'],
    _count: { _all: true },
  });

  const counts = {
    total: 0,
    draft: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    revision_requested: 0,
    featured: 0,
    suspended: 0,
  };

  for (const row of grouped) {
    counts[row.moderationStatus] = row._count._all;
    counts.total += row._count._all;
  }

  const [featured, suspended] = await Promise.all([
    prisma.course.count({ where: { isFeatured: true } }),
    prisma.course.count({ where: { suspendedAt: { not: null } } }),
  ]);
  counts.featured = featured;
  counts.suspended = suspended;
  return counts;
}

export async function findByIdForAdmin(
  courseId: string,
): Promise<CourseWithAdminInfo | null> {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: adminCourseInclude,
  });
}

export async function updateModerationStatus(
  courseId: string,
  data: {
    status: ModerationStatus;
    feedback?: string | null;
    reviewedById: string;
    publishOnApproval?: boolean;
  },
  tx?: Prisma.TransactionClient,
): Promise<CourseWithAdminInfo> {
  const client: PrismaLike = tx ?? prisma;
  const now = new Date();
  return client.course.update({
    where: { id: courseId },
    data: {
      moderationStatus: data.status,
      adminFeedback: data.feedback ?? null,
      reviewedById: data.reviewedById,
      reviewedAt: now,
      ...(data.status === 'approved' && data.publishOnApproval !== false
        ? { isPublished: true, publishedAt: now }
        : {}),
      ...(data.status === 'rejected' ? { isPublished: false } : {}),
    },
    include: adminCourseInclude,
  });
}

export async function setFeatured(
  courseId: string,
  isFeatured: boolean,
  tx?: Prisma.TransactionClient,
): Promise<CourseWithAdminInfo> {
  const client: PrismaLike = tx ?? prisma;
  return client.course.update({
    where: { id: courseId },
    data: { isFeatured },
    include: adminCourseInclude,
  });
}

export async function setSuspended(
  courseId: string,
  data: { suspendedAt: Date | null; reason?: string | null },
  tx?: Prisma.TransactionClient,
): Promise<CourseWithAdminInfo> {
  const client: PrismaLike = tx ?? prisma;
  return client.course.update({
    where: { id: courseId },
    data: {
      suspendedAt: data.suspendedAt,
      suspendReason: data.reason ?? null,
      // Suspend qilinganda marketplace'dan yashirinadi
      ...(data.suspendedAt !== null ? { isPublished: false } : {}),
    },
    include: adminCourseInclude,
  });
}
