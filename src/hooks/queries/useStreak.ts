'use client';

import { useQuery } from '@tanstack/react-query';
import type { StreakData } from '@/types/activity.types';
import { queryKeys } from './queryKeys';

async function fetchStreak(): Promise<StreakData> {
  const res = await fetch('/api/student/streak', { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useStreak() {
  return useQuery({
    queryKey: queryKeys.streak,
    queryFn: fetchStreak,
    staleTime: 5 * 60_000, // streak kun sayin o'zgaradi — 5 daqiqa cache
  });
}
