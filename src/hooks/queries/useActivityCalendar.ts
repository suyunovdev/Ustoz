'use client';

import { useQuery } from '@tanstack/react-query';
import type { ActivityRecord } from '@/types/activity.types';
import { queryKeys } from './queryKeys';

interface ActivityResponse {
  days: number;
  activities: ActivityRecord[];
}

async function fetchActivity(days: number): Promise<ActivityResponse> {
  const res = await fetch(`/api/student/activity?days=${days}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useActivityCalendar(days: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.activity(days),
    queryFn: () => fetchActivity(days),
    staleTime: 60_000,
    enabled,
  });
}
