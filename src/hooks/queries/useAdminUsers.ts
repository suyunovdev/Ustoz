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

export type AdminUsersSortField =
  | 'createdAt'
  | 'lastLoginAt'
  | 'fullName'
  | 'email'
  | 'role';

export interface AdminUsersResponse {
  users: AdminUserDTO[];
  total: number;
}

export interface AdminUsersFilters {
  role?: 'student' | 'teacher' | 'admin' | 'all';
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: AdminUsersSortField;
  order?: 'asc' | 'desc';
}

async function fetchAdminUsers(filters: AdminUsersFilters): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();
  if (filters.role) params.set('role', filters.role);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('limit', String(filters.pageSize));
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);

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
      page: filters.page,
      pageSize: filters.pageSize,
      sort: filters.sort,
      order: filters.order,
    }),
    queryFn: () => fetchAdminUsers(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData, // pagination/search/sort'da flicker bo'lmasligi uchun
  });
}
