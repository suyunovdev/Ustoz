'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

async function call<T>(url: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json as T;
}

export function useSetReviewReplyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { reviewId: string; reply: string }) =>
      call(`/api/teacher/reviews/${vars.reviewId}/reply`, {
        method: 'PUT',
        body: JSON.stringify({ reply: vars.reply }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-reviews'] });
    },
  });
}

export function useDeleteReviewReplyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reviewId: string) =>
      call(`/api/teacher/reviews/${reviewId}/reply`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-reviews'] });
    },
  });
}

export function useToggleHelpfulMutation() {
  return useMutation({
    mutationFn: (reviewId: string) =>
      call<{ marked: boolean; helpfulCount: number }>(
        `/api/reviews/${reviewId}/helpful`,
        { method: 'POST' },
      ),
  });
}
