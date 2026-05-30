'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type ModerationStatusDTO =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'revision_requested';

export interface AdminCourseDTO {
  id: string;
  title: string;
  description: string | null;
  coverImage: string | null;
  priceUzs: string;
  enrollmentCount: number;
  rating: string;
  reviewCount: number;
  isPublished: boolean;
  isFeatured: boolean;
  moderationStatus: ModerationStatusDTO;
  adminFeedback: string | null;
  suspendedAt: string | null;
  suspendReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  publishedAt: string | null;
  categoryRel: { id: string; name: string; slug: string } | null;
  teacher: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  };
  _count: { enrollments: number; topics: number; reviews: number };
}

export interface AdminCoursesStats {
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  revision_requested: number;
  featured: number;
  suspended: number;
}

export interface AdminCoursesResponse {
  courses: AdminCourseDTO[];
  total: number;
  nextCursor: string | null;
  stats: AdminCoursesStats;
}

export interface AdminCoursesFilters {
  status?: ModerationStatusDTO | 'all';
  search?: string;
  featuredOnly?: boolean;
  suspendedOnly?: boolean;
  cursor?: string | null;
  limit?: number;
}

async function fetchAdminCourses(
  filters: AdminCoursesFilters,
): Promise<AdminCoursesResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.featuredOnly) params.set('featuredOnly', 'true');
  if (filters.suspendedOnly) params.set('suspendedOnly', 'true');
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/admin/courses?${params}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Kurslarni yuklab boʻlmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminCourses(filters: AdminCoursesFilters = {}) {
  return useQuery<AdminCoursesResponse, Error>({
    queryKey: queryKeys.adminCourses({
      status: filters.status,
      search: filters.search,
      featuredOnly: filters.featuredOnly,
      suspendedOnly: filters.suspendedOnly,
      cursor: filters.cursor,
    }),
    queryFn: () => fetchAdminCourses(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
