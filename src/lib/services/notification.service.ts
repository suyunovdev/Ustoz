/**
 * Notification Service.
 *
 * Imkoniyatlar:
 *   - Inbox + counts (per type)
 *   - Mark as read (single, multiple, all)
 *   - Archive (single, all)
 *   - Delete
 *
 * Access: hamma narsa user'ning o'z notifikatsiyalari ustida (recipient check).
 */

import {
  notificationRepo,
  type NotificationTypeFilter,
  type NotificationStatusFilter,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';

const VALID_STATUSES = new Set<NotificationStatusFilter>(['unread', 'read', 'archived']);
const VALID_TYPES = new Set<NotificationTypeFilter>([
  'enrollment',
  'quiz_completion',
  'assignment_submission',
  'course_update',
  'achievement',
  'payment',
]);

export interface InboxSummary {
  rows: Awaited<ReturnType<typeof notificationRepo.listForUser>>['rows'];
  nextCursor: string | null;
  unreadCount: number;
  countsByType: Awaited<ReturnType<typeof notificationRepo.getCountsByType>>;
}

export async function getInbox(
  userId: string,
  filters: {
    status?: string;
    type?: string;
    cursor?: string;
    limit?: number;
  },
): Promise<InboxSummary> {
  const status =
    filters.status && VALID_STATUSES.has(filters.status as NotificationStatusFilter)
      ? (filters.status as NotificationStatusFilter)
      : undefined;
  const type =
    filters.type && VALID_TYPES.has(filters.type as NotificationTypeFilter)
      ? (filters.type as NotificationTypeFilter)
      : undefined;

  const [list, unreadCount, counts] = await Promise.all([
    notificationRepo.listForUser(userId, {
      status,
      type,
      cursor: filters.cursor,
      limit: filters.limit,
    }),
    notificationRepo.getUnreadCount(userId),
    notificationRepo.getCountsByType(userId),
  ]);

  return {
    rows: list.rows,
    nextCursor: list.nextCursor,
    unreadCount,
    countsByType: counts,
  };
}

export async function getBadge(userId: string): Promise<{ unreadCount: number }> {
  const unreadCount = await notificationRepo.getUnreadCount(userId);
  return { unreadCount };
}

export async function markRead(id: string, userId: string): Promise<void> {
  await notificationRepo.markAsRead(id, userId);
}

export async function markMultipleRead(
  ids: string[],
  userId: string,
): Promise<{ updated: number }> {
  if (ids.length === 0) return { updated: 0 };
  if (ids.length > 200) throw new ValidationError("Bir vaqtda 200 ta maksimum");
  const updated = await notificationRepo.markManyAsRead(ids, userId);
  return { updated };
}

export async function markAllRead(userId: string): Promise<{ updated: number }> {
  const updated = await notificationRepo.markAllAsRead(userId);
  return { updated };
}

export async function archive(id: string, userId: string): Promise<void> {
  await notificationRepo.archive(id, userId);
}

export async function archiveAll(userId: string): Promise<{ updated: number }> {
  const updated = await notificationRepo.archiveAll(userId);
  return { updated };
}

export async function deleteOne(id: string, userId: string): Promise<void> {
  await notificationRepo.deleteNotification(id, userId);
}
