'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type {
  AssignmentStatusDTO,
  SubmissionTypeDTO,
  AttachmentDTO,
} from '../queries/useAssignments';

export interface CreateAssignmentInput {
  courseId: string;
  topicId?: string | null;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: string;
  maxScore?: number;
  fileRequirements?: string;
  submissionType?: SubmissionTypeDTO;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string | null;
  instructions?: string | null;
  dueDate?: string;
  maxScore?: number;
  fileRequirements?: string | null;
  submissionType?: SubmissionTypeDTO;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  status?: AssignmentStatusDTO;
  topicId?: string | null;
}

export interface SubmitInput {
  submissionText?: string;
  submissionUrl?: string;
  attachments?: AttachmentDTO[];
}

export interface GradeInput {
  grade: number;
  feedback?: string;
  applyLatePenalty?: boolean;
}

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

export function useCreateAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAssignmentInput) =>
      call<{ assignment: { id: string } }>('/api/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}

export function useUpdateAssignmentMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateAssignmentInput) =>
      call(`/api/teacher/assignments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherAssignment(id) });
      qc.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}

export function useDeleteAssignmentMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => call(`/api/teacher/assignments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}

export function useSubmitAssignmentMutation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitInput) =>
      call(`/api/assignments/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myAssignmentSubmission(id) });
      qc.invalidateQueries({ queryKey: queryKeys.studentAssignments });
    },
  });
}

export function useGradeSubmissionMutation(assignmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { submissionId: string; input: GradeInput }) =>
      call(`/api/teacher/assignments/${assignmentId}/submissions/${vars.submissionId}`, {
        method: 'PATCH',
        body: JSON.stringify(vars.input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
      qc.invalidateQueries({ queryKey: ['teacher-assignments'] });
    },
  });
}

export function useReturnSubmissionMutation(assignmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { submissionId: string; feedback: string }) =>
      call(`/api/teacher/assignments/${assignmentId}/submissions/${vars.submissionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'return', feedback: vars.feedback }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignment-submissions', assignmentId] });
    },
  });
}
