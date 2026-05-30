'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface AdminStatsResponse {
  totalUsers: number;
  usersByRole: { student: number; teacher: number; admin: number };
  activeCourses: number;
  totalRevenueUzs: string;
  totalRevenueUsd: number;
  userGrowth: number;
  courseGrowth: number;
  revenueGrowth: number;
  newUsersLast30d: number;
  newCoursesLast30d: number;
  pendingPayments: number;
}

async function fetchAdminStats(): Promise<AdminStatsResponse> {
  const res = await fetch('/api/admin/stats', { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Stats yuklab boʻlmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminStats() {
  return useQuery<AdminStatsResponse, Error>({
    queryKey: queryKeys.adminStats,
    queryFn: fetchAdminStats,
    staleTime: 60_000, // 1 daqiqa
    gcTime: 5 * 60_000,
  });
}
