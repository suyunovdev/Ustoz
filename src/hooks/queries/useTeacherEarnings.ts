'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface BalanceDTO {
  grossRevenueUzs: string;
  refundedUzs: string;
  platformFeePct: number;
  platformFeeUzs: string;
  netRevenueUzs: string;
  withdrawnUzs: string;
  pendingWithdrawalUzs: string;
  availableUzs: string;
  completedPaymentCount: number;
  refundedPaymentCount: number;
}

export type PaymentStatusDTO =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface PaymentDTO {
  id: string;
  amountUzs: string;
  currency: string;
  status: PaymentStatusDTO;
  paymentMethod: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseId: string;
  createdAt: string;
  completedAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
}

export type WithdrawalStatusDTO =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type WithdrawalMethodDTO = 'bank_transfer' | 'card';

export interface WithdrawalDTO {
  id: string;
  amountUzs: string;
  status: WithdrawalStatusDTO;
  method: WithdrawalMethodDTO;
  bankName: string | null;
  bankAccountNumber: string | null;
  cardNumber: string | null;
  recipientName: string | null;
  note: string | null;
  adminNote: string | null;
  rejectionReason: string | null;
  requestedAt: string;
  processedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface PayoutSettingsDTO {
  payoutBankName: string | null;
  payoutAccountNumber: string | null;
  payoutRecipientName: string | null;
  payoutCardNumber: string | null;
}

export function useTeacherBalance() {
  return useQuery({
    queryKey: queryKeys.teacherBalance,
    queryFn: async () => {
      const res = await fetch('/api/teacher/earnings/balance', { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Balans yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ balance: BalanceDTO }>;
    },
    staleTime: 30_000,
  });
}

export function useTeacherPayments(filters: {
  status?: PaymentStatusDTO;
  courseId?: string;
  cursor?: string | null;
} = {}) {
  return useQuery({
    queryKey: queryKeys.teacherPayments(filters),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.status) p.set('status', filters.status);
      if (filters.courseId) p.set('courseId', filters.courseId);
      if (filters.cursor) p.set('cursor', filters.cursor);
      const res = await fetch(`/api/teacher/earnings/payments?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `To'lovlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ payments: PaymentDTO[]; nextCursor: string | null }>;
    },
    staleTime: 30_000,
  });
}

export function useTeacherWithdrawals(status?: WithdrawalStatusDTO) {
  return useQuery({
    queryKey: queryKeys.teacherWithdrawals(status),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (status) p.set('status', status);
      const res = await fetch(`/api/teacher/earnings/withdrawals?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `So'rovlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ withdrawals: WithdrawalDTO[] }>;
    },
    staleTime: 30_000,
  });
}

export function usePayoutSettings() {
  return useQuery({
    queryKey: queryKeys.payoutSettings,
    queryFn: async () => {
      const res = await fetch('/api/teacher/earnings/payout-settings', {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Sozlamalar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ settings: PayoutSettingsDTO }>;
    },
    staleTime: 60_000,
  });
}
