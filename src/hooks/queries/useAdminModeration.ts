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

export interface ModerationQueueItemDTO {
  id: string;
  materialId: string;
  reviewerId: string | null;
  status: ModerationStatusDTO;
  feedback: string | null;
  plagiarismScore: string | null;
  qualityScore: string | null;
  policyCompliant: boolean | null;
  submittedAt: string;
  reviewedAt: string | null;
  material: {
    id: string;
    title: string;
    description: string | null;
    contentType: string | null;
    fileFormat: string | null;
    fileUrl: string | null;
    externalLink: string | null;
    moderationStatus: ModerationStatusDTO;
    teacher: {
      id: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
    };
    course: { id: string; title: string } | null;
  };
  reviewer: { id: string; fullName: string; email: string } | null;
}

export interface ModerationStats {
  total: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  revision_requested: number;
  avgReviewMinutes: number;
}

export type AdminModerationSortField = 'submittedAt';

export interface ModerationResponse {
  items: ModerationQueueItemDTO[];
  total: number;
  stats: ModerationStats;
}

export interface ModerationFilters {
  status?: ModerationStatusDTO | 'all';
  contentType?: string | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: AdminModerationSortField;
  order?: 'asc' | 'desc';
}

async function fetchModeration(filters: ModerationFilters): Promise<ModerationResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.contentType) params.set('contentType', filters.contentType);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('limit', String(filters.pageSize));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);

  const res = await fetch(`/api/admin/moderation?${params}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Navbatni yuklab bo'lmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminModeration(filters: ModerationFilters = {}) {
  return useQuery<ModerationResponse, Error>({
    queryKey: queryKeys.adminModeration({
      status: filters.status,
      contentType: filters.contentType,
      search: filters.search,
      page: filters.page,
      pageSize: filters.pageSize,
      sort: filters.sort,
      order: filters.order,
    }),
    queryFn: () => fetchModeration(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
