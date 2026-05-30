'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type AssignmentStatusDTO = 'draft' | 'published' | 'archived';
export type SubmissionStatusDTO = 'submitted' | 'graded' | 'returned' | 'late';
export type SubmissionTypeDTO = 'text' | 'file' | 'url' | 'any';

export interface AttachmentDTO {
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface AssignmentListItemDTO {
  id: string;
  courseId: string;
  topicId: string | null;
  title: string;
  description: string | null;
  dueDate: string;
  maxScore: number;
  submissionType: SubmissionTypeDTO;
  status: AssignmentStatusDTO;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  submissionCount: number;
  gradedCount: number;
  courseTitle: string;
  createdAt: string;
}

export interface AssignmentDetailDTO {
  id: string;
  courseId: string;
  courseTitle: string;
  topicId: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: string;
  maxScore: number;
  fileRequirements: string | null;
  submissionType: SubmissionTypeDTO;
  status: AssignmentStatusDTO;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  createdAt: string;
}

export interface SubmissionDTO {
  id: string;
  studentId: string;
  assignmentId: string;
  submissionUrl: string | null;
  submissionText: string | null;
  attachments: AttachmentDTO[];
  status: SubmissionStatusDTO;
  isLate: boolean;
  revisionNumber: number;
  submittedAt: string;
  updatedAt: string;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
  gradedBy: string | null;
  studentName?: string;
  studentEmail?: string;
}

export interface StudentAssignmentDTO {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  courseTitle: string;
  dueDate: string;
  maxScore: number;
  submissionType: SubmissionTypeDTO;
  allowLateSubmission: boolean;
  isOverdue: boolean;
  mySubmission: null | {
    id: string;
    status: SubmissionStatusDTO;
    isLate: boolean;
    submittedAt: string;
    grade: number | null;
    feedback: string | null;
    revisionNumber: number;
  };
}

export function useTeacherAssignments(filters: {
  courseId?: string;
  topicId?: string;
  status?: AssignmentStatusDTO;
} = {}) {
  return useQuery({
    queryKey: queryKeys.teacherAssignments(filters),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.courseId) p.set('courseId', filters.courseId);
      if (filters.topicId) p.set('topicId', filters.topicId);
      if (filters.status) p.set('status', filters.status);
      const res = await fetch(`/api/teacher/assignments?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Vazifalar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ assignments: AssignmentListItemDTO[] }>;
    },
    staleTime: 30_000,
  });
}

export function useTeacherAssignment(id: string | null) {
  return useQuery({
    queryKey: queryKeys.teacherAssignment(id ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/assignments/${id}`, { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Vazifa yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ assignment: AssignmentDetailDTO }>;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useAssignmentSubmissions(
  assignmentId: string | null,
  status?: SubmissionStatusDTO,
) {
  return useQuery({
    queryKey: queryKeys.assignmentSubmissions(assignmentId ?? '', status),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (status) p.set('status', status);
      const res = await fetch(
        `/api/teacher/assignments/${assignmentId}/submissions?${p.toString()}`,
        { credentials: 'include' },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Topshiriqlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ submissions: SubmissionDTO[] }>;
    },
    enabled: !!assignmentId,
    staleTime: 15_000,
  });
}

export function useStudentAssignments() {
  return useQuery({
    queryKey: queryKeys.studentAssignments,
    queryFn: async () => {
      const res = await fetch('/api/student/assignments', { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Vazifalar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ assignments: StudentAssignmentDTO[] }>;
    },
    staleTime: 30_000,
  });
}

export function useAssignmentForStudent(id: string | null) {
  return useQuery({
    queryKey: queryKeys.studentAssignment(id ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/assignments/${id}`, { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Vazifa yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ assignment: AssignmentDetailDTO }>;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useMyAssignmentSubmission(id: string | null) {
  return useQuery({
    queryKey: queryKeys.myAssignmentSubmission(id ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/assignments/${id}/my-submission`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Topshiriq yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ submission: SubmissionDTO | null }>;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}
