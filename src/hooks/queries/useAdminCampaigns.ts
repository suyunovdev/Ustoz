'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type CampaignStatusDTO = 'draft' | 'sending' | 'completed' | 'failed';

export type RecipientFilterDTO =
  | { type: 'all_users' }
  | { type: 'by_role'; roles: Array<'student' | 'teacher' | 'admin'> }
  | { type: 'by_course'; courseIds: string[] }
  | { type: 'manual'; emails: string[] };

export interface CampaignDTO {
  id: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  recipientFilter: RecipientFilterDTO;
  status: CampaignStatusDTO;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  errorSummary: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: { id: string; fullName: string; email: string };
}

async function fetchCampaigns(): Promise<{ campaigns: CampaignDTO[] }> {
  const res = await fetch('/api/admin/campaigns', { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Kampaniyalarni yuklab bo'lmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminCampaigns() {
  return useQuery<{ campaigns: CampaignDTO[] }, Error>({
    queryKey: queryKeys.adminCampaigns,
    queryFn: fetchCampaigns,
    staleTime: 30_000,
  });
}
