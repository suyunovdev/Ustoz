/**
 * Recommendation Service
 * ----------------------
 * Personalized kurs tavsiyasi: 60% relevant + 30% diversity + 10% freshness.
 *
 * Cold start (0 enrollment) → top rated + popular + recent aralashma.
 *
 * Data layer: enrollment.repository + course.repository.
 * `getSimilarCourses` raw SQL (self-join aggregation) — Prisma helper'larsiz qiyin.
 */

import { enrollmentRepo, courseRepo } from '@/lib/repositories';
import type { CourseWithCategoryAndTeacher } from '@/lib/repositories';

export type RecommendReason =
  | 'category_match'
  | 'popular'
  | 'new_arrival'
  | 'top_rated';

export interface RecommendOptions {
  excludeIds?: string[];
  minRating?: number;
}

export interface RecommendedCourse {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  rating: number;
  enrollmentCount: number;
  priceUzs: number;
  totalDuration: number;
  difficultyLevel: string | null;
  category: { id: string; name: string; slug: string } | null;
  teacherName: string;
  recommendReason: RecommendReason;
}

// ─── Private helpers ──────────────────────────────────────────────────────

// Silent in production — replace with structured logger when needed
const log = (_msg: string, _extra?: Record<string, unknown>) => {
  // no-op
};

function formatCourse(
  c: CourseWithCategoryAndTeacher,
): Omit<RecommendedCourse, 'recommendReason'> {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    coverImage: c.coverImage,
    rating: Number(c.rating),
    enrollmentCount: c.enrollmentCount,
    priceUzs: Number(c.priceUzs),
    totalDuration: c.totalDuration,
    difficultyLevel: c.difficultyLevel,
    category: c.categoryRel
      ? { id: c.categoryRel.id, name: c.categoryRel.name, slug: c.categoryRel.slug }
      : null,
    teacherName: c.teacher?.fullName ?? 'Ustoz',
  };
}

async function getCoursesForNewUser(
  limit: number,
  excludeIds: string[] = [],
  minRating?: number,
): Promise<RecommendedCourse[]> {
  const courses = await courseRepo.findTopRatedPublished(excludeIds, limit, { minRating });
  return courses.map((c) => ({ ...formatCourse(c), recommendReason: 'top_rated' as const }));
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function getRecommendedCourses(
  studentId: string,
  limit = 6,
  options: RecommendOptions = {},
): Promise<RecommendedCourse[]> {
  const { excludeIds = [], minRating } = options;
  log('start', { studentId, limit, excludeCount: excludeIds.length });

  // QADAM 1 — Foydalanuvchi profili
  const userEnrollments = await enrollmentRepo.findCourseIdsAndCategories(studentId);

  const enrolledCourseIds = userEnrollments.map((e) => e.courseId);
  const userCategoryIds = Array.from(
    new Set(
      userEnrollments
        .map((e) => e.categoryId)
        .filter((id): id is string => id !== null),
    ),
  );

  const allExcludeIds = Array.from(new Set([...enrolledCourseIds, ...excludeIds]));

  log('profile', {
    enrollments: enrolledCourseIds.length,
    uniqueCategories: userCategoryIds.length,
    totalExclude: allExcludeIds.length,
  });

  // QADAM 2 — Cold start
  if (enrolledCourseIds.length === 0) {
    log('cold start path');
    return getCoursesForNewUser(limit, excludeIds, minRating);
  }

  // QADAM 3 — Relevant (60%)
  const relevantLimit = Math.ceil(limit * 0.6);
  const relevantCourses = await courseRepo.findPublishedByCategoriesExcluding(
    userCategoryIds,
    allExcludeIds,
    relevantLimit,
    { minRating },
  );
  const relevant: RecommendedCourse[] = relevantCourses.map((c) => ({
    ...formatCourse(c),
    recommendReason: 'category_match' as const,
  }));

  const usedIds = new Set<string>([...allExcludeIds, ...relevant.map((c) => c.id)]);

  // QADAM 4 — Diversity (30%)
  const diversityLimit = Math.ceil(limit * 0.3);
  const diversityCourses = await courseRepo.findPublishedExcludingCategories(
    userCategoryIds,
    Array.from(usedIds),
    diversityLimit,
  );
  const diversity: RecommendedCourse[] = diversityCourses.map((c) => ({
    ...formatCourse(c),
    recommendReason: 'popular' as const,
  }));
  diversity.forEach((c) => usedIds.add(c.id));

  // QADAM 5 — Freshness (10%) — so'nggi 30 kun
  const newLimit = Math.max(1, Math.floor(limit * 0.1));
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newCourses = await courseRepo.findRecentPublished(
    thirtyDaysAgo,
    Array.from(usedIds),
    newLimit,
  );
  const fresh: RecommendedCourse[] = newCourses.map((c) => ({
    ...formatCourse(c),
    recommendReason: 'new_arrival' as const,
  }));
  fresh.forEach((c) => usedIds.add(c.id));

  // QADAM 6 — Filler
  let combined: RecommendedCourse[] = [...relevant, ...diversity, ...fresh];
  if (combined.length < limit) {
    const remaining = limit - combined.length;
    const fillerCourses = await courseRepo.findTopRatedPublished(
      Array.from(usedIds),
      remaining,
    );
    const filler: RecommendedCourse[] = fillerCourses.map((c) => ({
      ...formatCourse(c),
      recommendReason: 'top_rated' as const,
    }));
    combined = [...combined, ...filler];
    log('filler applied', { added: filler.length });
  }

  log('done', {
    total: combined.length,
    breakdown: {
      category_match: relevant.length,
      popular: diversity.length,
      new_arrival: fresh.length,
      top_rated: combined.length - relevant.length - diversity.length - fresh.length,
    },
  });

  return combined.slice(0, limit);
}

/**
 * "Bu kursni o'qiganlar shularni ham o'qiydi" (collaborative filtering).
 * Raw SQL self-join — Prisma'da expressible emas.
 */
export async function getSimilarCourses(
  courseId: string,
  limit = 4,
): Promise<RecommendedCourse[]> {
  log('similar start', { courseId, limit });

  const rows = await courseRepo.findSimilarByEnrollment(courseId, limit);
  if (rows.length === 0) {
    log('similar: no overlap');
    return [];
  }

  const ids = rows.map((r) => r.id);
  const courses = await courseRepo.findByIds(ids);

  // Order'ni overlap DESC tartibida saqlash (findByIds uni saqlamaydi)
  const order = new Map(ids.map((id, i) => [id, i]));
  courses.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return courses.map((c) => ({
    ...formatCourse(c),
    recommendReason: 'popular' as const,
  }));
}
