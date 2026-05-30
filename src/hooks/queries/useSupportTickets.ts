'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type TicketStatusDTO =
  | 'open'
  | 'in_progress'
  | 'waiting_user'
  | 'resolved'
  | 'closed';

export type TicketPriorityDTO = 'low' | 'normal' | 'high' | 'urgent';

export interface TicketListItemDTO {
  id: string;
  userId: string;
  subject: string;
  category: string;
  status: TicketStatusDTO;
  priority: TicketPriorityDTO;
  lastMessageAt: string;
  lastMessageById: string;
  closedAt: string | null;
  createdAt: string;
  _count: { messages: number };
  assignedTo: { id: string; fullName: string } | null;
}

export interface TicketMessageDTO {
  id: string;
  ticketId: string;
  authorId: string;
  isAdminReply: boolean;
  body: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
  };
}

export interface TicketDetailDTO extends TicketListItemDTO {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
  messages: TicketMessageDTO[];
}

export function useMyTickets() {
  return useQuery({
    queryKey: queryKeys.myTickets,
    queryFn: async () => {
      const res = await fetch('/api/support/tickets', { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Murojaatlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ tickets: TicketListItemDTO[] }>;
    },
    staleTime: 30_000,
  });
}

export function useTicket(id: string | null) {
  return useQuery({
    queryKey: queryKeys.ticket(id ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/support/tickets/${id}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Murojaat yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{ ticket: TicketDetailDTO }>;
    },
    enabled: !!id,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
