'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type { TeacherApplicationDTO } from '../queries/useAdminTeacherApplications';

export type ReviewActionVars =
  | { applicationId: string; action: 'start_review' }
  | { applicationId: string; action: 'approve'; feedback?: string }
  | { applicationId: string; action: 'reject'; feedback: string };

async function patchApplication(
  vars: ReviewActionVars,
): Promise<{ application: TeacherApplicationDTO }> {
  const { applicationId, ...body } = vars;
  const res = await fetch(`/api/admin/teacher-applications/${applicationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Amal bajarilmadi (${res.status})`);
  }
  return json;
}

export function useReviewTeacherAppMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teacher-applications'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
}
