'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type {
  TicketPriorityDTO,
  TicketDetailDTO,
} from '../queries/useSupportTickets';

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

export interface CreateTicketInput {
  subject: string;
  category: string;
  message: string;
  priority?: TicketPriorityDTO;
}

export function useCreateTicketMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTicketInput) =>
      call<{ ticket: TicketDetailDTO }>('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.myTickets });
    },
  });
}

export function useReplyToTicketMutation(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      call<{ ticket: TicketDetailDTO }>(
        `/api/support/tickets/${ticketId}/messages`,
        { method: 'POST', body: JSON.stringify({ body }) },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ticket(ticketId) });
      qc.invalidateQueries({ queryKey: queryKeys.myTickets });
    },
  });
}
