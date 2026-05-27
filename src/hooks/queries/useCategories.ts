'use client';

import { useQuery } from '@tanstack/react-query';
import type { CategoryItem } from '@/types/recommendation.types';
import { queryKeys } from './queryKeys';

interface CategoriesResponse {
  categories: CategoryItem[];
}

async function fetchCategories(): Promise<CategoriesResponse> {
  const res = await fetch('/api/categories', { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Kategoriyalar kam o'zgaradi → staleTime: Infinity.
 * Manual `invalidateQueries(['categories'])` kerak bo'lganda chaqiriladi.
 */
export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: fetchCategories,
    staleTime: Infinity,
  });
}
