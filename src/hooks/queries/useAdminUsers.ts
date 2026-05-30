'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface AdminUserDTO {
  id: string;
  email: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
  avatarUrl: string | null;
  isActive: boolean;
  deletedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface AdminUsersResponse {
  users: AdminUserDTO[];
  total: number;
  nextCursor: string | null;
}

export interface AdminUsersFilters {
  role?: 'student' | 'teacher' | 'admin' | 'all';
  search?: string;
  cursor?: string | null;
  limit?: number;
}

async function fetchAdminUsers(filters: AdminUsersFilters): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.search) params.set('search', filters.search);
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/admin/users?${params}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Foydalanuvchilarni yuklab boʻlmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminUsers(filters: AdminUsersFilters = {}) {
  return useQuery<AdminUsersResponse, Error>({
    queryKey: queryKeys.adminUsers({
      role: filters.role,
      search: filters.search,
      cursor: filters.cursor,
    }),
    queryFn: () => fetchAdminUsers(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData, // pagination/search'da flicker bo'lmasligi uchun
  });
}
