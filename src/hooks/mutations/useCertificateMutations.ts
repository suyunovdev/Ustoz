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

export interface IssueCertificateInput {
  studentId: string;
  courseId: string;
  finalGrade?: number;
  forceIssue?: boolean;
}

export function useIssueCertificateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IssueCertificateInput) =>
      call<{ id: string; certificateNumber: string; created: boolean }>(
        '/api/teacher/certificates',
        { method: 'POST', body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-certificates'] });
    },
  });
}

export function useRevokeCertificateMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { certificateId: string; reason: string }) =>
      call(`/api/teacher/certificates/${vars.certificateId}/revoke`, {
        method: 'POST',
        body: JSON.stringify({ reason: vars.reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-certificates'] });
    },
  });
}
