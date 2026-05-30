/**
 * Course Review repository.
 *
 * Imkoniyatlar:
 *   - Sharh CRUD (talaba — bitta kursga bitta sharh)
 *   - Teacher reply (har sharhga bitta javob)
 *   - Helpful votes — kim "foydali" deb belgilagani
 *   - Statistika (avg rating + distribution)
 *   - Course.rating + reviewCount avtomatik yangilanadi
 */

import { prisma } from '@/lib/prisma';

export interface CourseReviewRow {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  studentAvatarUrl: string | null;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  hasUserMarkedHelpful: boolean;
  teacherReply: string | null;
  teacherReplyAt: Date | null;
  teacherReplyEditedAt: Date | null;
  hiddenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewStats {
  totalReviews: number;
  avgRating: number;
  distribution: { stars: number; count: number; pct: number }[];
  withCommentCount: number;
  repliedCount: number;
  repliedRatePct: number;
}

// ==================== READ ====================

export interface ListReviewsFilters {
  courseId?: string;
  teacherId?: string;
  studentId?: string;
  rating?: number;
  hasComment?: boolean;
  withoutReply?: boolean;
  /** Hidden reviews ham ko'rsatish (faqat teacher/admin uchun) */
  includeHidden?: boolean;
  cursor?: string;
  limit?: number;
  sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
}

export async function listReviews(
  filters: ListReviewsFilters,
  viewerUserId?: string,
): Promise<{ rows: CourseReviewRow[]; nextCursor: string | null }> {
  const limit = filters.limit ?? 20;
  const where: any = {};

  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.teacherId) where.course = { teacherId: filters.teacherId };
  if (filters.rating) where.rating = filters.rating;
  if (filters.hasComment) where.comment = { not: null };
  if (filters.withoutReply) where.teacherReply = null;
  if (!filters.includeHidden) where.hiddenAt = null;

  if (filters.cursor) where.id = { lt: filters.cursor };

  const orderBy: any =
    filters.sort === 'oldest'
      ? { createdAt: 'asc' }
      : filters.sort === 'highest_rating'
      ? [{ rating: 'desc' }, { createdAt: 'desc' }]
      : filters.sort === 'lowest_rating'
      ? [{ rating: 'asc' }, { createdAt: 'desc' }]
      : filters.sort === 'most_helpful'
      ? [{ helpfulCount: 'desc' }, { createdAt: 'desc' }]
      : { createdAt: 'desc' };

  const rows = await prisma.courseReview.findMany({
    where,
    include: {
      student: { select: { fullName: true, avatarUrl: true } },
      helpfulVotes: viewerUserId
        ? { where: { userId: viewerUserId }, select: { reviewId: true } }
        : false,
    },
    orderBy,
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    rows: items.map((r) => ({
      id: r.id,
      courseId: r.courseId,
      studentId: r.studentId,
      studentName: r.student.fullName,
      studentAvatarUrl: r.student.avatarUrl,
      rating: r.rating,
      comment: r.comment,
      isVerifiedPurchase: r.isVerifiedPurchase,
      helpfulCount: r.helpfulCount,
      hasUserMarkedHelpful: Array.isArray((r as any).helpfulVotes)
        ? (r as any).helpfulVotes.length > 0
        : false,
      teacherReply: r.teacherReply,
      teacherReplyAt: r.teacherReplyAt,
      teacherReplyEditedAt: r.teacherReplyEditedAt,
      hiddenAt: r.hiddenAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export async function findReviewById(id: string): Promise<{
  id: string;
  courseId: string;
  studentId: string;
  rating: number;
  teacherReply: string | null;
} | null> {
  return prisma.courseReview.findUnique({
    where: { id },
    select: {
      id: true,
      courseId: true,
      studentId: true,
      rating: true,
      teacherReply: true,
    },
  });
}

export async function findUserReview(
  courseId: string,
  studentId: string,
): Promise<CourseReviewRow | null> {
  const r = await prisma.courseReview.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
    include: {
      student: { select: { fullName: true, avatarUrl: true } },
      helpfulVotes: { where: { userId: studentId }, select: { reviewId: true } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    courseId: r.courseId,
    studentId: r.studentId,
    studentName: r.student.fullName,
    studentAvatarUrl: r.student.avatarUrl,
    rating: r.rating,
    comment: r.comment,
    isVerifiedPurchase: r.isVerifiedPurchase,
    helpfulCount: r.helpfulCount,
    hasUserMarkedHelpful: r.helpfulVotes.length > 0,
    teacherReply: r.teacherReply,
    teacherReplyAt: r.teacherReplyAt,
    teacherReplyEditedAt: r.teacherReplyEditedAt,
    hiddenAt: r.hiddenAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// ==================== STATS ====================

export async function getReviewStats(courseId: string): Promise<ReviewStats> {
  const rows = await prisma.$queryRaw<
    Array<{
      total: bigint;
      avg: number;
      stars5: bigint;
      stars4: bigint;
      stars3: bigint;
      stars2: bigint;
      stars1: bigint;
      withComment: bigint;
      replied: bigint;
    }>
  >`
    SELECT
      COUNT(*)::bigint AS total,
      COALESCE(AVG(rating)::float, 0) AS avg,
      COUNT(*) FILTER (WHERE rating = 5)::bigint AS "stars5",
      COUNT(*) FILTER (WHERE rating = 4)::bigint AS "stars4",
      COUNT(*) FILTER (WHERE rating = 3)::bigint AS "stars3",
      COUNT(*) FILTER (WHERE rating = 2)::bigint AS "stars2",
      COUNT(*) FILTER (WHERE rating = 1)::bigint AS "stars1",
      COUNT(*) FILTER (WHERE comment IS NOT NULL)::bigint AS "withComment",
      COUNT(*) FILTER (WHERE teacher_reply IS NOT NULL)::bigint AS "replied"
    FROM course_reviews
    WHERE course_id = ${courseId}::uuid AND hidden_at IS NULL
  `;
  const r = rows[0];
  const total = Number(r.total);
  const counts = {
    5: Number(r.stars5),
    4: Number(r.stars4),
    3: Number(r.stars3),
    2: Number(r.stars2),
    1: Number(r.stars1),
  };
  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars as keyof typeof counts],
    pct: total > 0 ? Math.round((counts[stars as keyof typeof counts] / total) * 100) : 0,
  }));
  return {
    totalReviews: total,
    avgRating: Math.round((r.avg ?? 0) * 100) / 100,
    distribution,
    withCommentCount: Number(r.withComment),
    repliedCount: Number(r.replied),
    repliedRatePct:
      total > 0 ? Math.round((Number(r.replied) / total) * 100) : 0,
  };
}

// ==================== WRITE — STUDENT ====================

export interface UpsertReviewInput {
  courseId: string;
  studentId: string;
  rating: number;
  comment?: string | null;
}

/**
 * Upsert review + course.rating + reviewCount avtomatik yangilash.
 * Course.rating average atomik tarzda hisoblanadi.
 */
export async function upsertReview(input: UpsertReviewInput): Promise<{ id: string }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.courseReview.findUnique({
      where: { courseId_studentId: { courseId: input.courseId, studentId: input.studentId } },
    });

    let reviewId: string;
    if (existing) {
      await tx.courseReview.update({
        where: { id: existing.id },
        data: { rating: input.rating, comment: input.comment ?? null },
      });
      reviewId = existing.id;
    } else {
      const created = await tx.courseReview.create({
        data: {
          courseId: input.courseId,
          studentId: input.studentId,
          rating: input.rating,
          comment: input.comment ?? null,
        },
      });
      reviewId = created.id;
    }

    // Course aggregate yangilash
    await recalcCourseRating(tx, input.courseId);
    return { id: reviewId };
  });
}

export async function deleteReview(reviewId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const r = await tx.courseReview.findUnique({ where: { id: reviewId } });
    if (!r) return;
    await tx.courseReview.delete({ where: { id: reviewId } });
    await recalcCourseRating(tx, r.courseId);
  });
}

async function recalcCourseRating(tx: any, courseId: string): Promise<void> {
  const agg = await tx.courseReview.aggregate({
    where: { courseId, hiddenAt: null },
    _avg: { rating: true },
    _count: true,
  });
  await tx.course.update({
    where: { id: courseId },
    data: {
      rating: agg._avg.rating ?? 0,
      reviewCount: agg._count,
    },
  });
}

// ==================== TEACHER REPLY ====================

export async function setTeacherReply(
  reviewId: string,
  reply: string | null,
): Promise<void> {
  const existing = await prisma.courseReview.findUnique({
    where: { id: reviewId },
    select: { teacherReplyAt: true },
  });
  if (!existing) return;

  if (reply === null) {
    await prisma.courseReview.update({
      where: { id: reviewId },
      data: {
        teacherReply: null,
        teacherReplyAt: null,
        teacherReplyEditedAt: null,
      },
    });
    return;
  }

  await prisma.courseReview.update({
    where: { id: reviewId },
    data: {
      teacherReply: reply,
      ...(existing.teacherReplyAt
        ? { teacherReplyEditedAt: new Date() }
        : { teacherReplyAt: new Date() }),
    },
  });
}

// ==================== HELPFUL VOTES ====================

/**
 * Toggle helpful — agar foydalanuvchi avval bosgan bo'lsa, olib tashlanadi.
 * Returns: { marked: true } yoki { marked: false } (unmarked), va yangilangan count.
 */
export async function toggleHelpful(
  reviewId: string,
  userId: string,
): Promise<{ marked: boolean; helpfulCount: number }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.reviewHelpfulVote.findUnique({
      where: { reviewId_userId: { reviewId, userId } },
    });

    if (existing) {
      await tx.reviewHelpfulVote.delete({
        where: { reviewId_userId: { reviewId, userId } },
      });
      const updated = await tx.courseReview.update({
        where: { id: reviewId },
        data: { helpfulCount: { decrement: 1 } },
        select: { helpfulCount: true },
      });
      return { marked: false, helpfulCount: updated.helpfulCount };
    }

    await tx.reviewHelpfulVote.create({ data: { reviewId, userId } });
    const updated = await tx.courseReview.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
      select: { helpfulCount: true },
    });
    return { marked: true, helpfulCount: updated.helpfulCount };
  });
}

// ==================== ACCESS HELPERS ====================

export async function isReviewOwner(
  reviewId: string,
  studentId: string,
): Promise<boolean> {
  const r = await prisma.courseReview.findUnique({
    where: { id: reviewId },
    select: { studentId: true },
  });
  return r?.studentId === studentId;
}

export async function isReviewCourseOwner(
  reviewId: string,
  teacherId: string,
): Promise<boolean> {
  const r = await prisma.courseReview.findUnique({
    where: { id: reviewId },
    include: { course: { select: { teacherId: true } } },
  });
  return r?.course.teacherId === teacherId;
}

/**
 * Talaba kursga yozilganmi (review yaratish uchun shart).
 */
export async function isEnrolled(
  courseId: string,
  studentId: string,
): Promise<boolean> {
  const e = await prisma.enrollment.findFirst({
    where: { courseId, studentId },
    select: { id: true },
  });
  return e !== null;
}
