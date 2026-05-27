/**
 * Course repository — `courses` jadvali uchun.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

const courseInclude = {
  categoryRel: { select: { id: true, name: true, slug: true } },
  teacher: { select: { fullName: true } },
} satisfies Prisma.CourseInclude;

export type CourseWithCategoryAndTeacher = Prisma.CourseGetPayload<{
  include: typeof courseInclude;
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
