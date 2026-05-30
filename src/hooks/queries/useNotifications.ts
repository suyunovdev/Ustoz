'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './queryKeys';

export type NotificationTypeDTO =
  | 'enrollment'
  | 'quiz_completion'
  | 'assignment_submission'
  | 'course_update'
  | 'achievement'
  | 'payment';

export type NotificationStatusDTO = 'unread' | 'read' | 'archived';

export interface NotificationDTO {
  id: string;
  recipientId: string;
  senderId: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  type: NotificationTypeDTO;
  title: string;
  message: string;
  status: NotificationStatusDTO;
  relatedCourseId: string | null;
  relatedCourseTitle: string | null;
  relatedEntityId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface CountsByTypeDTO {
  type: string;
  total: number;
  unread: number;
}

export interface InboxDTO {
  rows: NotificationDTO[];
  nextCursor: string | null;
  unreadCount: number;
  countsByType: CountsByTypeDTO[];
}

export function useNotifications(filters: {
  status?: NotificationStatusDTO;
  type?: NotificationTypeDTO;
} = {}) {
  return useQuery({
    queryKey: queryKeys.notifications(filters),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (filters.status) p.set('status', filters.status);
      if (filters.type) p.set('type', filters.type);
      const res = await fetch(`/api/notifications?${p.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Bildirishnomalar yuklanmadi (${res.status})`);
      }
      return res.json() as Promise<InboxDTO>;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useNotificationBadge() {
  return useQuery({
    queryKey: queryKeys.notificationBadge,
    queryFn: async () => {
      const res = await fetch('/api/notifications/badge', {
        credentials: 'include',
      });
      if (!res.ok) return { unreadCount: 0 };
      return res.json() as Promise<{ unreadCount: number }>;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
