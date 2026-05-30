'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type { AdminCourseDTO } from '../queries/useAdminCourses';

export type CourseActionMutationVars =
  | { courseId: string; action: 'approve'; feedback?: string }
  | { courseId: string; action: 'reject'; feedback: string }
  | { courseId: string; action: 'request_revision'; feedback: string }
  | { courseId: string; action: 'feature' }
  | { courseId: string; action: 'unfeature' }
  | { courseId: string; action: 'suspend'; reason: string }
  | { courseId: string; action: 'unsuspend' };

async function patchCourse(
  vars: CourseActionMutationVars,
): Promise<{ course: AdminCourseDTO }> {
  const { courseId, ...body } = vars;
  const res = await fetch(`/api/admin/courses/${courseId}`, {
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

export function useCourseActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}
