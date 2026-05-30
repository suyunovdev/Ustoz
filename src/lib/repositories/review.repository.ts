/**
 * Course Review repository — `course_reviews` jadvali uchun.
 * Admin moderatsiya queries.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const adminReviewInclude = {
  course: { select: { id: true, title: true } },
  student: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
} satisfies Prisma.CourseReviewInclude;

export type AdminReviewRow = Prisma.CourseReviewGetPayload<{
  include: typeof adminReviewInclude;
}>;

export type ReviewStatusFilter = 'all' | 'visible' | 'hidden' | 'reported';

export interface AdminReviewsFilters {
  status?: ReviewStatusFilter;
  rating?: number | 'all';
  search?: string;
  limit?: number;
  cursor?: string | null;
}

function buildWhere(filters: AdminReviewsFilters): Prisma.CourseReviewWhereInput {
  const { status, rating, search } = filters;
  return {
    ...(status === 'visible' ? { hiddenAt: null } : {}),
    ...(status === 'hidden' ? { hiddenAt: { not: null } } : {}),
    ...(status === 'reported' ? { reportCount: { gt: 0 } } : {}),
    ...(typeof rating === 'number' ? { rating } : {}),
    ...(search
      ? {
          OR: [
            { comment: { contains: search, mode: 'insensitive' } },
            { course: { title: { contains: search, mode: 'insensitive' } } },
            { student: { email: { contains: search, mode: 'insensitive' } } },
            { student: { fullName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export async function findAllForAdmin(
  filters: AdminReviewsFilters = {},
): Promise<AdminReviewRow[]> {
  const { limit = 20, cursor } = filters;
  return prisma.courseReview.findMany({
    where: buildWhere(filters),
    include: adminReviewInclude,
    orderBy: [{ reportCount: 'desc' }, { createdAt: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function countForAdmin(
  filters: AdminReviewsFilters = {},
): Promise<number> {
  return prisma.courseReview.count({ where: buildWhere(filters) });
}

export async function statusCountsForAdmin(): Promise<{
  total: number;
  visible: number;
  hidden: number;
  reported: number;
  avgRating: number;
}> {
  const [total, hidden, reported, avgRow] = await Promise.all([
    prisma.courseReview.count(),
    prisma.courseReview.count({ where: { hiddenAt: { not: null } } }),
    prisma.courseReview.count({ where: { reportCount: { gt: 0 } } }),
    prisma.courseReview.aggregate({
      _avg: { rating: true },
      where: { hiddenAt: null },
    }),
  ]);
  return {
    total,
    visible: total - hidden,
    hidden,
    reported,
    avgRating: Number((avgRow._avg.rating ?? 0).toFixed(2)),
  };
}

export async function findByIdForAdmin(reviewId: string): Promise<AdminReviewRow | null> {
  return prisma.courseReview.findUnique({
    where: { id: reviewId },
    include: adminReviewInclude,
  });
}

export async function setHidden(
  reviewId: string,
  data: { hiddenAt: Date | null; reason?: string | null; hiddenById?: string | null },
  tx?: Prisma.TransactionClient,
): Promise<AdminReviewRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.courseReview.update({
    where: { id: reviewId },
    data: {
      hiddenAt: data.hiddenAt,
      hideReason: data.reason ?? null,
      hiddenById: data.hiddenAt ? data.hiddenById ?? null : null,
    },
    include: adminReviewInclude,
  });
}

export async function deleteById(
  reviewId: string,
  tx?: Prisma.TransactionClient,
): Promise<{ courseId: string; rating: number }> {
  const client: PrismaLike = tx ?? prisma;
  const deleted = await client.courseReview.delete({
    where: { id: reviewId },
    select: { courseId: true, rating: true },
  });
  return deleted;
}
