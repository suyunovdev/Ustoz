'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queries/queryKeys';
import type {
  TicketDetailDTO,
  TicketStatusDTO,
} from '../queries/useAdminTickets';

interface ReplyVars {
  ticketId: string;
  body: string;
}

async function postReply(vars: ReplyVars): Promise<{ ticket: TicketDetailDTO }> {
  const res = await fetch(`/api/admin/tickets/${vars.ticketId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ body: vars.body }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Javob yuborilmadi (${res.status})`);
  }
  return json;
}

export function useTicketReplyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: postReply,
    onSuccess: (data, vars) => {
      queryClient.setQueryData(queryKeys.adminTicket(vars.ticketId), data);
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });
}

interface StatusVars {
  ticketId: string;
  newStatus: TicketStatusDTO;
}

async function patchStatus(vars: StatusVars): Promise<{ ticket: TicketDetailDTO }> {
  const res = await fetch(`/api/admin/tickets/${vars.ticketId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: 'change_status', newStatus: vars.newStatus }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Status o'zgartirilmadi (${res.status})`);
  }
  return json;
}

export function useTicketStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: patchStatus,
    onSuccess: (data, vars) => {
      queryClient.setQueryData(queryKeys.adminTicket(vars.ticketId), data);
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
  });
}
