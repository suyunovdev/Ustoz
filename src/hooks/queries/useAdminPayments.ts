'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type TransactionStatusDTO =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentMethodDTO = 'click' | 'payme';

export interface AdminTransactionDTO {
  id: string;
  studentId: string;
  courseId: string;
  amountUzs: string;
  amountUsd: string;
  currency: string;
  paymentMethod: PaymentMethodDTO;
  status: TransactionStatusDTO;
  gatewayTransactionId: string | null;
  merchantTransId: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
  refundedAt: string | null;
  refundReason: string | null;
  refundedById: string | null;
  student: { id: string; fullName: string; email: string };
  course: { id: string; title: string; coverImage: string | null };
}

export interface AdminPaymentsStats {
  total: number;
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
  cancelled: number;
}

export interface AdminPaymentsResponse {
  transactions: AdminTransactionDTO[];
  total: number;
  nextCursor: string | null;
  stats: AdminPaymentsStats;
  totalRevenueUzs: string;
}

export interface AdminPaymentsFilters {
  status?: TransactionStatusDTO | 'all';
  method?: PaymentMethodDTO | 'all';
  search?: string;
  cursor?: string | null;
  limit?: number;
}

async function fetchAdminPayments(
  filters: AdminPaymentsFilters,
): Promise<AdminPaymentsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.method) params.set('method', filters.method);
  if (filters.search) params.set('search', filters.search);
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/admin/payments?${params}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `To'lovlarni yuklab bo'lmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminPayments(filters: AdminPaymentsFilters = {}) {
  return useQuery<AdminPaymentsResponse, Error>({
    queryKey: queryKeys.adminPayments({
      status: filters.status,
      method: filters.method,
      search: filters.search,
      cursor: filters.cursor,
    }),
    queryFn: () => fetchAdminPayments(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
