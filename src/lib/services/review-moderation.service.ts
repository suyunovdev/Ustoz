/**
 * Review Moderation Service
 * -------------------------
 * Admin uchun sharhlarni boshqarish:
 *   - List + filter
 *   - Yashirish (hide) + sabab — Course.rating qayta hisoblanmaydi (UX uchun yumshoq)
 *   - Ko'rsatish (unhide)
 *   - O'chirish (hard delete) — agressiv spam uchun. Course.rating qayta hisoblanadi.
 *
 * Har action audit log'ga yoziladi.
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  reviewRepo,
  type AdminReviewRow,
  type AdminReviewsFilters,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { log as auditLog } from './audit-log.service';

export class ReviewNotFoundError extends Error {
  code = 'REVIEW_NOT_FOUND';
  constructor(id: string) {
    super(`Review not found: ${id}`);
    this.name = 'ReviewNotFoundError';
  }
}

export interface ListReviewsResult {
  reviews: AdminReviewRow[];
  total: number;
  nextCursor: string | null;
  stats: Awaited<ReturnType<typeof reviewRepo.statusCountsForAdmin>>;
}

export async function listReviews(
  filters: AdminReviewsFilters = {},
): Promise<ListReviewsResult> {
  const limit = filters.limit ?? 20;
  const [rows, total, stats] = await Promise.all([
    reviewRepo.findAllForAdmin({ ...filters, limit }),
    reviewRepo.countForAdmin(filters),
    reviewRepo.statusCountsForAdmin(),
  ]);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    reviews: items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    stats,
  };
}

export async function hideReview(
  adminId: string,
  reviewId: string,
  reason: string,
  request?: NextRequest,
): Promise<AdminReviewRow> {
  if (!reason || reason.trim().length < 5) {
    throw new ValidationError('Yashirish sababi kerak (kamida 5 belgi)');
  }
  const target = await reviewRepo.findByIdForAdmin(reviewId);
  if (!target) throw new ReviewNotFoundError(reviewId);
  if (target.hiddenAt !== null) return target; // idempotent

  return prisma.$transaction(async (tx) => {
    const updated = await reviewRepo.setHidden(
      reviewId,
      { hiddenAt: new Date(), reason, hiddenById: adminId },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'review.hide',
        targetType: 'review',
        targetId: reviewId,
        metadata: {
          reason,
          courseId: target.courseId,
          studentId: target.studentId,
          rating: target.rating,
        },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function unhideReview(
  adminId: string,
  reviewId: string,
  request?: NextRequest,
): Promise<AdminReviewRow> {
  const target = await reviewRepo.findByIdForAdmin(reviewId);
  if (!target) throw new ReviewNotFoundError(reviewId);
  if (target.hiddenAt === null) return target; // idempotent

  return prisma.$transaction(async (tx) => {
    const updated = await reviewRepo.setHidden(
      reviewId,
      { hiddenAt: null, reason: null, hiddenById: null },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'review.unhide',
        targetType: 'review',
        targetId: reviewId,
        metadata: { courseId: target.courseId },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function deleteReview(
  adminId: string,
  reviewId: string,
  reason: string,
  request?: NextRequest,
): Promise<{ deletedId: string; courseId: string }> {
  if (!reason || reason.trim().length < 5) {
    throw new ValidationError("O'chirish sababi kerak (kamida 5 belgi)");
  }
  const target = await reviewRepo.findByIdForAdmin(reviewId);
  if (!target) throw new ReviewNotFoundError(reviewId);

  return prisma.$transaction(async (tx) => {
    const deleted = await reviewRepo.deleteById(reviewId, tx);

    // Kursning rating'ini qayta hisoblash
    const agg = await tx.courseReview.aggregate({
      where: { courseId: deleted.courseId, hiddenAt: null },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await tx.course.update({
      where: { id: deleted.courseId },
      data: {
        rating: Number((agg._avg.rating ?? 0).toFixed(2)),
        reviewCount: agg._count._all,
      },
    });

    await auditLog(
      {
        adminId,
        action: 'review.delete',
        targetType: 'review',
        targetId: reviewId,
        metadata: {
          reason,
          courseId: target.courseId,
          studentId: target.studentId,
          rating: target.rating,
          comment: target.comment,
        },
        request,
      },
      tx,
    );

    return { deletedId: reviewId, courseId: deleted.courseId };
  });
}

export type ReviewActionPayload =
  | { action: 'hide'; reason: string }
  | { action: 'unhide' }
  | { action: 'delete'; reason: string };

export async function applyAction(
  adminId: string,
  reviewId: string,
  payload: ReviewActionPayload,
  request?: NextRequest,
): Promise<
  | { type: 'updated'; review: AdminReviewRow }
  | { type: 'deleted'; deletedId: string; courseId: string }
> {
  switch (payload.action) {
    case 'hide': {
      const review = await hideReview(adminId, reviewId, payload.reason, request);
      return { type: 'updated', review };
    }
    case 'unhide': {
      const review = await unhideReview(adminId, reviewId, request);
      return { type: 'updated', review };
    }
    case 'delete': {
      const result = await deleteReview(adminId, reviewId, payload.reason, request);
      return { type: 'deleted', ...result };
    }
    default: {
      const exhaustive: never = payload;
      throw new ValidationError(`Noma'lum amal: ${JSON.stringify(exhaustive)}`);
    }
  }
}
