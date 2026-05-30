'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
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
  assignedToId: string | null;
  lastMessageAt: string;
  lastMessageById: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string; avatarUrl: string | null };
  assignedTo: { id: string; fullName: string } | null;
  _count: { messages: number };
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
    role: 'student' | 'teacher' | 'admin';
  };
}

export interface TicketDetailDTO {
  id: string;
  userId: string;
  subject: string;
  category: string;
  status: TicketStatusDTO;
  priority: TicketPriorityDTO;
  assignedToId: string | null;
  lastMessageAt: string;
  closedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: 'student' | 'teacher' | 'admin';
  };
  assignedTo: { id: string; fullName: string; email: string } | null;
  messages: TicketMessageDTO[];
}

export interface TicketsStats {
  total: number;
  open: number;
  in_progress: number;
  waiting_user: number;
  resolved: number;
  closed: number;
}

export interface AdminTicketsResponse {
  tickets: TicketListItemDTO[];
  total: number;
  nextCursor: string | null;
  stats: TicketsStats;
}

export interface AdminTicketsFilters {
  status?: TicketStatusDTO | 'all';
  priority?: TicketPriorityDTO | 'all';
  search?: string;
  assignedToMe?: boolean;
  cursor?: string | null;
  limit?: number;
}

async function fetchTickets(filters: AdminTicketsFilters): Promise<AdminTicketsResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.search) params.set('search', filters.search);
  if (filters.assignedToMe) params.set('assignedToMe', 'true');
  if (filters.cursor) params.set('cursor', filters.cursor);
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/admin/tickets?${params}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Ticket'larni yuklab bo'lmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminTickets(filters: AdminTicketsFilters = {}) {
  return useQuery<AdminTicketsResponse, Error>({
    queryKey: queryKeys.adminTickets({
      status: filters.status,
      priority: filters.priority,
      search: filters.search,
      assignedToMe: filters.assignedToMe,
      cursor: filters.cursor,
    }),
    queryFn: () => fetchTickets(filters),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

async function fetchTicket(ticketId: string): Promise<{ ticket: TicketDetailDTO }> {
  const res = await fetch(`/api/admin/tickets/${ticketId}`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Ticket yuklanmadi (${res.status})`);
  }
  return res.json();
}

export function useAdminTicket(ticketId: string | null) {
  return useQuery({
    queryKey: queryKeys.adminTicket(ticketId ?? ''),
    queryFn: () => fetchTicket(ticketId!),
    enabled: !!ticketId,
    staleTime: 10_000,
  });
}
