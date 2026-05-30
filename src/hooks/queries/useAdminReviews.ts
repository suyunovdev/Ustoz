'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type ReviewStatusDTO = 'all' | 'visible' | 'hidden' | 'reported';

export interface AdminReviewDTO {
  id: string;
  courseId: string;
  studentId: string;
  rating: number;
  comment: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  hiddenAt: string | null;
  hideReason: string | null;
  hiddenById: string | null;
  reportCount: number;
  createdAt: string;
  course: { id: string; title: string };
  student: { id: string; fullName: string; email: string; avatarUrl: string | null };
}

export interface AdminReviewsStats {
  total: number;
  visible: number;
  hidden: number;
  reported: number;
  avgRating: number;
}

export interface AdminReviewsResponse {
  reviews: AdminReviewDTO[];
  total: number;
  nextCursor: string | null;
  stats: AdminReviewsStats;
}

export interface AdminReviewsFilters {
  status?: ReviewStatusDTO;
  rating?: number | 'all';
  search?: string;
  cursor?: string | null;
  limit?: number;
}

async function fetchAdminReviews(
  filters: AdminReviewsFilters,
): Promise<AdminReviewsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.rating && filters.rating !== 'all') params.set('rating', String(filters.rating));
  if (filters.search) params.set('search', filters.search);
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/admin/reviews?${params}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Sharhlarni yuklab bo'lmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminReviews(filters: AdminReviewsFilters = {}) {
  return useQuery<AdminReviewsResponse, Error>({
    queryKey: queryKeys.adminReviews({
      status: filters.status,
      rating: filters.rating,
      search: filters.search,
      cursor: filters.cursor,
    }),
    queryFn: () => fetchAdminReviews(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
