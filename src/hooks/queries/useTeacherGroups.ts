'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type GroupStatusDTO = 'active' | 'archived';
export type GroupColorDTO =
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink';

export interface GroupDTO {
  id: string;
  teacherId: string;
  courseId: string | null;
  name: string;
  description: string | null;
  maxMembers: number;
  status: GroupStatusDTO;
  meetingUrl: string | null;
  scheduleNote: string | null;
  color: GroupColorDTO;
  memberCount: number;
  courseTitle: string | null;
  createdAt: string;
}

export interface GroupMemberDTO {
  studentId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export function useTeacherGroups(filters: {
  courseId?: string;
  status?: GroupStatusDTO;
  search?: string;
} = {}) {
  return useQuery({
    queryKey: queryKeys.teacherGroups(filters),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.courseId) p.set('courseId', filters.courseId);
      if (filters.status) p.set('status', filters.status);
      if (filters.search) p.set('search', filters.search);
      const res = await fetch(`/api/teacher/groups?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Guruhlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ groups: GroupDTO[] }>;
    },
    staleTime: 30_000,
  });
}

export function useTeacherGroup(id: string | null) {
  return useQuery({
    queryKey: queryKeys.teacherGroup(id ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/groups/${id}`, { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Guruh yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ group: GroupDTO }>;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useGroupMembers(groupId: string | null) {
  return useQuery({
    queryKey: queryKeys.teacherGroupMembers(groupId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/groups/${groupId}/members`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `A'zolar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ members: GroupMemberDTO[] }>;
    },
    enabled: !!groupId,
    staleTime: 15_000,
  });
}
