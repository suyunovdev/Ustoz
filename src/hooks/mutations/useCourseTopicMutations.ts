'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type { CourseTopicDTO } from '../queries/useCourseTopics';

export interface TopicFormInput {
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  duration?: string;
  content?: string;
  hasQuiz?: boolean;
  isFreePreview?: boolean;
  isLocked?: boolean;
  moduleTitle?: string | null;
}

async function createTopic(vars: {
  courseId: string;
  input: TopicFormInput;
}): Promise<{ topic: CourseTopicDTO }> {
  const res = await fetch(`/api/teacher/courses/${vars.courseId}/topics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(vars.input),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Mavzu yaratilmadi (${res.status})`);
  return json;
}

async function updateTopic(vars: {
  courseId: string;
  topicId: string;
  input: Partial<TopicFormInput>;
}): Promise<{ topic: CourseTopicDTO }> {
  const res = await fetch(
    `/api/teacher/courses/${vars.courseId}/topics/${vars.topicId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(vars.input),
    },
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Mavzu yangilanmadi (${res.status})`);
  return json;
}

async function deleteTopic(vars: { courseId: string; topicId: string }): Promise<void> {
  const res = await fetch(
    `/api/teacher/courses/${vars.courseId}/topics/${vars.topicId}`,
    { method: 'DELETE', credentials: 'include' },
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Mavzu o'chirilmadi (${res.status})`);
  }
}

async function reorderTopics(vars: {
  courseId: string;
  orderedIds: string[];
}): Promise<void> {
  const res = await fetch(`/api/teacher/courses/${vars.courseId}/topics/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ orderedIds: vars.orderedIds }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Tartib o'zgartirilmadi (${res.status})`);
  }
}

async function moveTopic(vars: {
  courseId: string;
  topicId: string;
  direction: 'up' | 'down';
}): Promise<void> {
  const res = await fetch(
    `/api/teacher/courses/${vars.courseId}/topics/${vars.topicId}/move`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ direction: vars.direction }),
    },
  );
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || `Tartib o'zgartirilmadi (${res.status})`);
  }
}

export function useCreateTopicMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TopicFormInput) => createTopic({ courseId, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherCourseTopics(courseId) });
      qc.invalidateQueries({ queryKey: queryKeys.teacherDashboard });
    },
  });
}

export function useUpdateTopicMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      topicId,
      input,
    }: {
      topicId: string;
      input: Partial<TopicFormInput>;
    }) => updateTopic({ courseId, topicId, input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherCourseTopics(courseId) });
    },
  });
}

export function useDeleteTopicMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (topicId: string) => deleteTopic({ courseId, topicId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherCourseTopics(courseId) });
      qc.invalidateQueries({ queryKey: queryKeys.teacherDashboard });
    },
  });
}

export function useMoveTopicMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ topicId, direction }: { topicId: string; direction: 'up' | 'down' }) =>
      moveTopic({ courseId, topicId, direction }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherCourseTopics(courseId) });
    },
  });
}

export function useReorderTopicsMutation(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderTopics({ courseId, orderedIds }),
    // Optimistic update — drag drop'da darrov UI yangilanadi
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: queryKeys.teacherCourseTopics(courseId) });
      const previous = qc.getQueryData<{
        topics: Array<{ id: string; orderIndex: number }>;
      }>(queryKeys.teacherCourseTopics(courseId));
      if (previous) {
        const byId = new Map(previous.topics.map((t) => [t.id, t]));
        const reordered = orderedIds
          .map((id, idx) => {
            const t = byId.get(id);
            if (!t) return null;
            return { ...t, orderIndex: idx + 1 };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);
        qc.setQueryData(queryKeys.teacherCourseTopics(courseId), {
          ...previous,
          topics: reordered,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(queryKeys.teacherCourseTopics(courseId), ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherCourseTopics(courseId) });
    },
  });
}
