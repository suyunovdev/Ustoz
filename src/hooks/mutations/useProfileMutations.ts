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

export interface UpdateProfileInput {
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string;
  headline?: string;
  expertise?: string[];
  socialLinks?: Record<string, string>;
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) =>
      call('/api/profile', { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (vars: { oldPassword: string; newPassword: string }) =>
      call('/api/profile/password', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
  });
}

export function useUpdateNotificationPrefsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Record<string, boolean>) =>
      call('/api/profile/notification-prefs', {
        method: 'PATCH',
        body: JSON.stringify(prefs),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}

export function useRequestDeletionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string | null) =>
      call('/api/profile/deletion-request', {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}

export function useCancelDeletionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      call('/api/profile/deletion-request', { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myProfile });
    },
  });
}
