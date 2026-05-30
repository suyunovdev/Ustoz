'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';

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

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['notifications'] });
  qc.invalidateQueries({ queryKey: queryKeys.notificationBadge });
}

export function useMarkReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      call(`/api/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useMarkAllReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      call<{ updated: number }>('/api/notifications/read-all', {
        method: 'POST',
      }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useArchiveNotificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      call(`/api/notifications/${id}/archive`, { method: 'POST' }),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteNotificationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      call(`/api/notifications?id=${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidateAll(qc),
  });
}
