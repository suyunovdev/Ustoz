'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export interface ConversationListItemDTO {
  id: string;
  teacherId: string;
  studentId: string;
  courseId: string | null;
  courseTitle: string | null;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerAvatarUrl: string | null;
  partnerRole: string;
}

export interface ConversationDetailDTO {
  id: string;
  teacherId: string;
  studentId: string;
  courseId: string | null;
  courseTitle: string | null;
  partner: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
  teacherUnreadCount: number;
  studentUnreadCount: number;
  createdAt: string;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function useConversations() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: async () => {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Inbox yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{
        conversations: ConversationListItemDTO[];
        totalUnread: number;
      }>;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.conversationMessages(conversationId ?? ''),
    queryFn: async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Xabarlar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<{
        conversation: ConversationDetailDTO;
        messages: MessageDTO[];
      }>;
    },
    enabled: !!conversationId,
    staleTime: 5_000,
    refetchInterval: 10_000,
  });
}
