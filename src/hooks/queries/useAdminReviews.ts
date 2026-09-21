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

export type AdminReviewsSortField = 'createdAt' | 'rating' | 'reportCount';

export interface AdminReviewsResponse {
  reviews: AdminReviewDTO[];
  total: number;
  stats: AdminReviewsStats;
}

export interface AdminReviewsFilters {
  status?: ReviewStatusDTO;
  rating?: number | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: AdminReviewsSortField;
  order?: 'asc' | 'desc';
}

async function fetchAdminReviews(
  filters: AdminReviewsFilters,
): Promise<AdminReviewsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.rating && filters.rating !== 'all') params.set('rating', String(filters.rating));
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('limit', String(filters.pageSize));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);

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
      page: filters.page,
      pageSize: filters.pageSize,
      sort: filters.sort,
      order: filters.order,
    }),
    queryFn: () => fetchAdminReviews(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
