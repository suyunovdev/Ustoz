'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type EarningStatusDTO = 'pending' | 'paid' | 'cancelled';

export interface ReferralInfoDTO {
  code: string;
  clicks: number;
  signups: number;
  payingUsers: number;
  conversionPct: number;
  totalEarnedUzs: string;
  pendingEarningsUzs: string;
  paidEarningsUzs: string;
}

export interface EarningDTO {
  id: string;
  referredUserId: string;
  referredUserName: string;
  courseTitle: string | null;
  amountUzs: string;
  commissionPct: number;
  status: EarningStatusDTO;
  createdAt: string;
  paidAt: string | null;
}

export function useMyReferral() {
  return useQuery({
    queryKey: queryKeys.myReferral,
    queryFn: async () => {
      const res = await fetch('/api/referrals/me', { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Referral yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ referral: ReferralInfoDTO }>;
    },
    staleTime: 60_000,
  });
}

export function useMyEarnings(status?: EarningStatusDTO) {
  return useQuery({
    queryKey: queryKeys.myReferralEarnings(status),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (status) p.set('status', status);
      const res = await fetch(`/api/referrals/earnings?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Daromad yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ rows: EarningDTO[]; nextCursor: string | null }>;
    },
    staleTime: 60_000,
  });
}
