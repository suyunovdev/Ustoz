'use client';

import { useQuery } from '@tanstack/react-query';
import type { DashboardData } from '@/types/dashboard.types';
import { queryKeys } from './queryKeys';

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/enrollments/my', { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * `/api/enrollments/my` cache + auto-refetch.
 * staleTime: 30s — har sahifa qaytarish instant, lekin 30s dan keyin yangilanadi.
 */
export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.studentDashboard,
    queryFn: fetchDashboard,
    staleTime: 30_000,
  });
}
