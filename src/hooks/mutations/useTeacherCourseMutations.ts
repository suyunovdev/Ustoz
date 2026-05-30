'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';

async function patchCourse(vars: {
  courseId: string;
  isPublished?: boolean;
}): Promise<void> {
  const { courseId, ...body } = vars;
  const res = await fetch(`/api/teacher/courses/${courseId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Yangilanmadi (${res.status})`);
  }
}

async function deleteCourse(courseId: string): Promise<void> {
  const res = await fetch(`/api/teacher/courses/${courseId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `O'chirilmadi (${res.status})`);
  }
}

async function duplicateCourse(courseId: string): Promise<{ course: { id: string } }> {
  const res = await fetch(`/api/teacher/courses/${courseId}/duplicate`, {
    method: 'POST',
    credentials: 'include',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Nusxalashda xato (${res.status})`);
  return json;
}

export function useArchiveCourseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => patchCourse({ courseId, isPublished: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teacherDashboard }),
  });
}

export function useUnarchiveCourseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => patchCourse({ courseId, isPublished: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teacherDashboard }),
  });
}

export function useDeleteCourseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teacherDashboard }),
  });
}

export function useDuplicateCourseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: duplicateCourse,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.teacherDashboard }),
  });
}
