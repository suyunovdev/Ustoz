'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminReviewDTO } from '../queries/useAdminReviews';

export type ReviewActionMutationVars =
  | { reviewId: string; action: 'hide'; reason: string }
  | { reviewId: string; action: 'unhide' }
  | { reviewId: string; action: 'delete'; reason: string };

type Response =
  | { type: 'updated'; review: AdminReviewDTO }
  | { type: 'deleted'; deletedId: string; courseId: string };

async function patchReview(vars: ReviewActionMutationVars): Promise<Response> {
  const { reviewId, ...body } = vars;
  const res = await fetch(`/api/admin/reviews/${reviewId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Amal bajarilmadi (${res.status})`);
  }
  return json;
}

export function useReviewActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    },
  });
}
