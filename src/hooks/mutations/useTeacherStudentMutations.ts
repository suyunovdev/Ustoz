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

export function useToggleEnrollmentMutation(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { enrollmentId: string; isActive: boolean }) =>
      call(`/api/teacher/enrollments/${vars.enrollmentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: vars.isActive }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherStudent(studentId) });
      qc.invalidateQueries({ queryKey: ['teacher-students'] });
    },
  });
}

export function useRemoveEnrollmentMutation(studentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enrollmentId: string) =>
      call(`/api/teacher/enrollments/${enrollmentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherStudent(studentId) });
      qc.invalidateQueries({ queryKey: ['teacher-students'] });
    },
  });
}

export function useNotifyStudentMutation() {
  return useMutation({
    mutationFn: (vars: {
      studentId: string;
      title: string;
      message: string;
      courseId?: string | null;
    }) =>
      call(`/api/teacher/students/${vars.studentId}/notify`, {
        method: 'POST',
        body: JSON.stringify({
          title: vars.title,
          message: vars.message,
          courseId: vars.courseId,
        }),
      }),
  });
}

export function useBroadcastToCourseMutation() {
  return useMutation({
    mutationFn: (vars: {
      courseId: string;
      title: string;
      message: string;
      activeOnly?: boolean;
    }) =>
      call<{ sent: number }>(`/api/teacher/courses/${vars.courseId}/broadcast`, {
        method: 'POST',
        body: JSON.stringify({
          title: vars.title,
          message: vars.message,
          activeOnly: vars.activeOnly ?? true,
        }),
      }),
  });
}
