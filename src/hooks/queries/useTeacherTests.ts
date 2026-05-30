'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type QuestionTypeDTO = 'single' | 'multiple' | 'true_false' | 'text';
export type TestStatusDTO = 'draft' | 'published' | 'archived';

export interface QuestionOptionDTO {
  text: string;
  isCorrect: boolean;
}

export interface QuestionDTO {
  id: string;
  testId: string;
  questionOrder: number;
  questionText: string;
  questionType: QuestionTypeDTO;
  options: QuestionOptionDTO[] | null;
  correctAnswers: string[] | null;
  points: number;
  explanation: string | null;
}

export interface TestListItemDTO {
  id: string;
  title: string;
  description: string | null;
  courseId: string | null;
  topicId: string | null;
  passingScore: number;
  timeLimitSec: number | null;
  allowedAttempts: number;
  status: TestStatusDTO;
  totalPoints: number;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
}

export interface TestDetailDTO extends Omit<TestListItemDTO, 'questionCount' | 'attemptCount'> {
  randomizeQuestions: boolean;
  showCorrectAnswers: boolean;
  questions: QuestionDTO[];
}

export interface TestAttemptDTO {
  id: string;
  testId: string;
  studentId: string;
  attemptNumber: number;
  startedAt: string;
  submittedAt: string | null;
  score: number;
  maxScore: number;
  percentage: string;
  passed: boolean;
  status: string;
  studentName?: string;
  studentEmail?: string;
}

export function useTeacherTests(filters: {
  courseId?: string;
  topicId?: string;
  status?: TestStatusDTO;
} = {}) {
  return useQuery({
    queryKey: queryKeys.teacherTests(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.courseId) params.set('courseId', filters.courseId);
      if (filters.topicId) params.set('topicId', filters.topicId);
      if (filters.status) params.set('status', filters.status);
      const res = await fetch(`/api/teacher/tests?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Testlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ tests: TestListItemDTO[] }>;
    },
    staleTime: 30_000,
  });
}

export function useTeacherTest(id: string | null) {
  return useQuery({
    queryKey: queryKeys.teacherTest(id ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/tests/${id}`, { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Test yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ test: TestDetailDTO }>;
    },
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useTeacherTestAttempts(testId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.teacherTestAttempts(testId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/teacher/tests/${testId}/attempts`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Urinishlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ attempts: TestAttemptDTO[] }>;
    },
    enabled: !!testId && enabled,
    staleTime: 15_000,
  });
}
