'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ModerationQueueItemDTO } from '../queries/useAdminModeration';

export type ModerateActionVars =
  | { queueId: string; action: 'start_review' }
  | { queueId: string; action: 'approve'; feedback?: string }
  | { queueId: string; action: 'reject'; feedback: string }
  | { queueId: string; action: 'request_revision'; feedback: string };

async function patchQueue(
  vars: ModerateActionVars,
): Promise<{ item: ModerationQueueItemDTO }> {
  const { queueId, ...body } = vars;
  const res = await fetch(`/api/admin/moderation/${queueId}`, {
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

export function useModerateMaterialMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-moderation'] });
    },
  });
}
