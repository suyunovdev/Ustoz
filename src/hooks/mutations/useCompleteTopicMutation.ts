'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CompleteTopicResponse, DashboardData } from '@/types/dashboard.types';
import { queryKeys } from '@/hooks/queries/queryKeys';

interface CompleteTopicVars {
  topicId: string;
  /** Optimistic update va invalidation uchun (URL'dan keladi). */
  courseId: string;
}

interface MutationContext {
  previous?: DashboardData;
}

/**
 * Topic complete mutation — optimistic update bilan.
 *
 * UX:
 *  - onMutate: dashboard cache'da progress'ni darrov oshiradi
 *  - onError:  rollback (oldingi snapshot tiklanadi)
 *  - onSettled: dashboard + streak + activity invalidate qilinadi (server bilan sync)
 */
export function useCompleteTopicMutation() {
  const queryClient = useQueryClient();

  return useMutation<CompleteTopicResponse, Error, CompleteTopicVars, MutationContext>({
    mutationFn: async ({ topicId }) => {
      const res = await fetch(`/api/topics/${topicId}/complete`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `HTTP ${res.status}`);
      }
      return res.json();
    },

    // Optimistic update: progress'ni oldindan ko'rsatish
    onMutate: async ({ courseId }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.studentDashboard });

      const previous = queryClient.getQueryData<DashboardData>(queryKeys.studentDashboard);

      if (previous) {
        queryClient.setQueryData<DashboardData>(queryKeys.studentDashboard, {
          ...previous,
          enrollments: previous.enrollments.map((e) => {
            if (e.courseId !== courseId || e.isCompleted) return e;
            const nextCompleted = Math.min(e.totalTopics, e.completedTopicsCount + 1);
            const nextProgress =
              e.totalTopics > 0
                ? Math.round((nextCompleted / e.totalTopics) * 100)
                : e.progress;
            return {
              ...e,
              completedTopicsCount: nextCompleted,
              progress: nextProgress,
              lastAccessedAt: new Date().toISOString(),
            };
          }),
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.studentDashboard, context.previous);
      }
    },

    // Server bilan sync (har holda)
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studentDashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
      queryClient.invalidateQueries({ queryKey: ['student-activity'] });
    },
  });
}
