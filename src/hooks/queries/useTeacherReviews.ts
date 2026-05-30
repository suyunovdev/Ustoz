'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type ReviewSortDTO =
  | 'newest'
  | 'oldest'
  | 'highest_rating'
  | 'lowest_rating'
  | 'most_helpful';

export interface ReviewDTO {
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
  teacherReplyAt: string | null;
  teacherReplyEditedAt: string | null;
  hiddenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewStatsDTO {
  totalReviews: number;
  avgRating: number;
  distribution: { stars: number; count: number; pct: number }[];
  withCommentCount: number;
  repliedCount: number;
  repliedRatePct: number;
}

export function useTeacherReviews(filters: {
  courseId?: string;
  rating?: number;
  hasComment?: boolean;
  withoutReply?: boolean;
  sort?: ReviewSortDTO;
} = {}) {
  return useQuery({
    queryKey: queryKeys.teacherReviews(filters),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.courseId) p.set('courseId', filters.courseId);
      if (filters.rating) p.set('rating', String(filters.rating));
      if (filters.hasComment) p.set('hasComment', 'true');
      if (filters.withoutReply) p.set('withoutReply', 'true');
      if (filters.sort) p.set('sort', filters.sort);
      const res = await fetch(`/api/teacher/reviews?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Sharhlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{
        rows: ReviewDTO[];
        nextCursor: string | null;
      }>;
    },
    staleTime: 30_000,
  });
}

export function useCourseReviewStats(courseId: string | null) {
  return useQuery({
    queryKey: queryKeys.courseReviewStats(courseId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/reviews/stats`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Statistika yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ stats: ReviewStatsDTO }>;
    },
    enabled: !!courseId,
    staleTime: 60_000,
  });
}
