/**
 * Course Review Service
 * ---------------------
 *
 * Imkoniyatlar:
 *   - Talaba: sharh yaratish/yangilash/o'chirish (faqat enrolled)
 *   - Talaba: "foydali" tugmasi (toggle)
 *   - Teacher: o'z kursi sharhlariga javob yozish + tahrirlash + o'chirish
 *   - Public: kursning sharh ro'yxati va statistika
 */

import { courseReviewRepo } from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import {
  isValidTemplateForRating,
  getTemplateText,
} from '@/lib/data/review-templates';

export class ReviewNotFoundError extends Error {
  code = 'REVIEW_NOT_FOUND';
  constructor() {
    super("Sharh topilmadi");
    this.name = 'ReviewNotFoundError';
  }
}

export class ReviewAccessDeniedError extends Error {
  code = 'REVIEW_ACCESS_DENIED';
  constructor() {
    super("Ruxsat yo'q");
    this.name = 'ReviewAccessDeniedError';
  }
}

export class NotEnrolledError extends Error {
  code = 'NOT_ENROLLED';
  constructor() {
    super("Sharh yozish uchun kursga yozilgan bo'lishingiz kerak");
    this.name = 'NotEnrolledError';
  }
}

const MAX_REPLY_LENGTH = 2000;

function validateRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new ValidationError("Reyting 1-5 oralig'ida");
  }
}

function validateReply(reply: string): string {
  const trimmed = reply.trim();
  if (trimmed.length < 2) throw new ValidationError("Javob kamida 2 belgi");
  if (trimmed.length > MAX_REPLY_LENGTH) {
    throw new ValidationError(`Javob ${MAX_REPLY_LENGTH} belgidan oshmasin`);
  }
  return trimmed;
}

// ==================== PUBLIC ====================

export async function listCourseReviews(
  courseId: string,
  filters: {
    rating?: number;
    hasComment?: boolean;
    cursor?: string;
    sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
  },
  viewerUserId?: string,
) {
  return courseReviewRepo.listReviews({ courseId, ...filters }, viewerUserId);
}

export async function getCourseReviewStats(courseId: string) {
  return courseReviewRepo.getReviewStats(courseId);
}

// ==================== STUDENT ====================

export interface UpsertReviewServiceInput {
  rating: number;
  /**
   * Tanlangan shablon ID (masalan "5-1"). Erkin matn EMAS — faqat
   * `review-templates.ts`'da ro'yxatdan o'tgan ID'lar qabul qilinadi.
   * Bo'sh qoldirsa — sharhsiz, faqat reyting saqlanadi.
   */
  templateId?: string;
}

export async function upsertOwnReview(
  courseId: string,
  studentId: string,
  input: UpsertReviewServiceInput,
) {
  validateRating(input.rating);

  // Template ID → matn (erkin matn rad etiladi)
  let comment: string | null = null;
  if (input.templateId) {
    if (!isValidTemplateForRating(input.templateId, input.rating)) {
      throw new ValidationError(
        `Tanlangan shablon ${input.rating}⭐ reytingiga mos kelmaydi`,
      );
    }
    comment = getTemplateText(input.templateId);
    if (!comment) throw new ValidationError("Shablon topilmadi");
  }

  const enrolled = await courseReviewRepo.isEnrolled(courseId, studentId);
  if (!enrolled) throw new NotEnrolledError();

  return courseReviewRepo.upsertReview({
    courseId,
    studentId,
    rating: input.rating,
    comment,
  });
}

export async function getMyReview(courseId: string, studentId: string) {
  return courseReviewRepo.findUserReview(courseId, studentId);
}

export async function deleteOwnReview(reviewId: string, studentId: string) {
  const isOwner = await courseReviewRepo.isReviewOwner(reviewId, studentId);
  if (!isOwner) throw new ReviewAccessDeniedError();
  await courseReviewRepo.deleteReview(reviewId);
}

export async function toggleReviewHelpful(reviewId: string, userId: string) {
  const r = await courseReviewRepo.findReviewById(reviewId);
  if (!r) throw new ReviewNotFoundError();
  return courseReviewRepo.toggleHelpful(reviewId, userId);
}

// ==================== TEACHER REPLY ====================

export async function setReviewReply(
  reviewId: string,
  teacherId: string,
  reply: string,
) {
  const isOwner = await courseReviewRepo.isReviewCourseOwner(reviewId, teacherId);
  if (!isOwner) throw new ReviewAccessDeniedError();
  const validated = validateReply(reply);
  await courseReviewRepo.setTeacherReply(reviewId, validated);
}

export async function deleteReviewReply(reviewId: string, teacherId: string) {
  const isOwner = await courseReviewRepo.isReviewCourseOwner(reviewId, teacherId);
  if (!isOwner) throw new ReviewAccessDeniedError();
  await courseReviewRepo.setTeacherReply(reviewId, null);
}

export async function listTeacherReviews(
  teacherId: string,
  filters: {
    courseId?: string;
    rating?: number;
    hasComment?: boolean;
    withoutReply?: boolean;
    cursor?: string;
    sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
  },
) {
  return courseReviewRepo.listReviews(
    { teacherId, ...filters, includeHidden: true },
    teacherId,
  );
}
