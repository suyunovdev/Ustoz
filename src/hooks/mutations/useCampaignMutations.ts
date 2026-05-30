'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type {
  CampaignDTO,
  RecipientFilterDTO,
} from '../queries/useAdminCampaigns';

interface CreateCampaignVars {
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  recipientFilter: RecipientFilterDTO;
}

async function createCampaign(
  vars: CreateCampaignVars,
): Promise<{ campaign: CampaignDTO }> {
  const res = await fetch('/api/admin/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(vars),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Yuborish bajarilmadi (${res.status})`);
  }
  return json;
}

export function useCreateCampaignMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminCampaigns });
    },
  });
}

interface PreviewVars {
  recipientFilter: RecipientFilterDTO;
}

interface PreviewResult {
  count: number;
  capped: boolean;
  sample: Array<{ email: string; fullName: string }>;
}

async function previewRecipients(vars: PreviewVars): Promise<PreviewResult> {
  const res = await fetch('/api/admin/campaigns/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(vars),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Preview olinmadi (${res.status})`);
  }
  return json;
}

export function usePreviewRecipientsMutation() {
  return useMutation({ mutationFn: previewRecipients });
}
