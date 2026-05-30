'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type {
  QuestionTypeDTO,
  QuestionOptionDTO,
  TestStatusDTO,
} from '../queries/useTeacherTests';

export interface CreateTestInput {
  courseId: string;
  topicId?: string | null;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimitSec?: number | null;
  allowedAttempts?: number;
  randomizeQuestions?: boolean;
  showCorrectAnswers?: boolean;
}

export interface UpdateTestInput {
  title?: string;
  description?: string | null;
  passingScore?: number;
  timeLimitSec?: number | null;
  allowedAttempts?: number;
  randomizeQuestions?: boolean;
  showCorrectAnswers?: boolean;
  status?: TestStatusDTO;
  topicId?: string | null;
}

export interface AddQuestionInput {
  questionText: string;
  questionType: QuestionTypeDTO;
  options?: QuestionOptionDTO[];
  correctAnswers?: string[];
  points?: number;
  explanation?: string;
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

export function useCreateTestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTestInput) =>
      call<{ test: { id: string } }>('/api/teacher/tests', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-tests'] });
    },
  });
}

export function useUpdateTestMutation(testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTestInput) =>
      call(`/api/teacher/tests/${testId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherTest(testId) });
      qc.invalidateQueries({ queryKey: ['teacher-tests'] });
    },
  });
}

export function useDeleteTestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (testId: string) =>
      call(`/api/teacher/tests/${testId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacher-tests'] });
    },
  });
}

export function useAddQuestionMutation(testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AddQuestionInput) =>
      call(`/api/teacher/tests/${testId}/questions`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherTest(testId) });
    },
  });
}

export function useUpdateQuestionMutation(testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { questionId: string; input: Partial<AddQuestionInput> }) =>
      call(`/api/teacher/tests/${testId}/questions/${vars.questionId}`, {
        method: 'PATCH',
        body: JSON.stringify(vars.input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherTest(testId) });
    },
  });
}

export function useDeleteQuestionMutation(testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      call(`/api/teacher/tests/${testId}/questions/${questionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherTest(testId) });
    },
  });
}
