'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type {
  WithdrawalMethodDTO,
  PayoutSettingsDTO,
} from '../queries/useTeacherEarnings';

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

export interface RequestWithdrawalInput {
  amountUzs: string | number;
  method: WithdrawalMethodDTO;
  bankName?: string;
  bankAccountNumber?: string;
  cardNumber?: string;
  recipientName: string;
  note?: string;
}

export function useRequestWithdrawalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RequestWithdrawalInput) =>
      call('/api/teacher/earnings/withdrawals', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherBalance });
      qc.invalidateQueries({ queryKey: ['teacher-withdrawals'] });
    },
  });
}

export function useCancelWithdrawalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      call(`/api/teacher/earnings/withdrawals/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.teacherBalance });
      qc.invalidateQueries({ queryKey: ['teacher-withdrawals'] });
    },
  });
}

export function useUpdatePayoutSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PayoutSettingsDTO>) =>
      call('/api/teacher/earnings/payout-settings', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.payoutSettings });
    },
  });
}
