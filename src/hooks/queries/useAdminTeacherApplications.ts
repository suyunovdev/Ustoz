'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type ApplicationStatusDTO = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface TeacherApplicationDTO {
  id: string;
  userId: string;
  status: ApplicationStatusDTO;
  fullName: string;
  email: string;
  phone: string | null;
  expertise: string;
  bio: string;
  motivation: string;
  experience: string | null;
  sampleUrl: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  feedback: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    avatarUrl: string | null;
  };
}

export interface ApplicationsStats {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
}

export interface AdminApplicationsResponse {
  applications: TeacherApplicationDTO[];
  total: number;
  nextCursor: string | null;
  stats: ApplicationsStats;
}

export interface AdminApplicationsFilters {
  status?: ApplicationStatusDTO | 'all';
  search?: string;
  cursor?: string | null;
  limit?: number;
}

async function fetchApplications(
  filters: AdminApplicationsFilters,
): Promise<AdminApplicationsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/admin/teacher-applications?${params}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Arizalarni yuklab bo'lmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminTeacherApplications(filters: AdminApplicationsFilters = {}) {
  return useQuery<AdminApplicationsResponse, Error>({
    queryKey: queryKeys.adminTeacherApplications({
      status: filters.status,
      search: filters.search,
      cursor: filters.cursor,
    }),
    queryFn: () => fetchApplications(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
