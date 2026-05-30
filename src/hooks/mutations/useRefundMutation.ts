'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type { AdminTransactionDTO } from '../queries/useAdminPayments';

interface RefundVars {
  transactionId: string;
  reason: string;
}

async function refundTransaction(
  vars: RefundVars,
): Promise<{ transaction: AdminTransactionDTO }> {
  const res = await fetch(`/api/admin/payments/${vars.transactionId}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason: vars.reason }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Refund bajarilmadi (${res.status})`);
  }
  return json;
}

export function useRefundMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: refundTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminStats });
    },
  });
}
