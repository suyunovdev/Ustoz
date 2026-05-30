'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type { GroupColorDTO, GroupStatusDTO } from '../queries/useTeacherGroups';

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

export interface CreateGroupInput {
  name: string;
  description?: string;
  courseId?: string | null;
  maxMembers?: number;
  meetingUrl?: string;
  scheduleNote?: string;
  color?: GroupColorDTO;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  courseId?: string | null;
  maxMembers?: number;
  status?: GroupStatusDTO;
  meetingUrl?: string | null;
  scheduleNote?: string | null;
  color?: GroupColorDTO;
}

export function useCreateGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGroupInput) =>
      call<{ group: { id: string } }>('/api/teacher/groups', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-groups'] });
    },
  });
}

export function useUpdateGroupMutation(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateGroupInput) =>
      call(`/api/teacher/groups/${groupId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherGroup(groupId) });
      qc.invalidateQueries({ queryKey: ['teacher-groups'] });
    },
  });
}

export function useDeleteGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => call(`/api/teacher/groups/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-groups'] });
    },
  });
}

export function useAddMemberMutation(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      call(`/api/teacher/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify({ studentId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherGroupMembers(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.teacherGroup(groupId) });
      qc.invalidateQueries({ queryKey: ['teacher-groups'] });
    },
  });
}

export function useBulkAddMembersMutation(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentIds: string[]) =>
      call<{ added: number; skipped: number; ineligible: number }>(
        `/api/teacher/groups/${groupId}/members/bulk`,
        {
          method: 'POST',
          body: JSON.stringify({ studentIds }),
        },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherGroupMembers(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.teacherGroup(groupId) });
      qc.invalidateQueries({ queryKey: ['teacher-groups'] });
    },
  });
}

export function useRemoveMemberMutation(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      call(`/api/teacher/groups/${groupId}/members/${studentId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherGroupMembers(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.teacherGroup(groupId) });
      qc.invalidateQueries({ queryKey: ['teacher-groups'] });
    },
  });
}

export function useBroadcastToGroupMutation(groupId: string) {
  return useMutation({
    mutationFn: (vars: { title: string; message: string }) =>
      call<{ sent: number }>(`/api/teacher/groups/${groupId}/broadcast`, {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
  });
}
