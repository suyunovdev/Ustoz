/**
 * Notification repository.
 *
 * NotificationType: enrollment | quiz_completion | assignment_submission |
 *                   course_update | achievement | payment
 * NotificationStatus: unread | read | archived
 */

import { prisma } from '@/lib/prisma';

export type NotificationTypeFilter =
  | 'enrollment'
  | 'quiz_completion'
  | 'assignment_submission'
  | 'course_update'
  | 'achievement'
  | 'payment';

export type NotificationStatusFilter = 'unread' | 'read' | 'archived';

export interface NotificationRow {
  id: string;
  recipientId: string;
  senderId: string | null;
  senderName: string | null;
  senderAvatarUrl: string | null;
  type: string;
  title: string;
  message: string;
  status: string;
  relatedCourseId: string | null;
  relatedCourseTitle: string | null;
  relatedEntityId: string | null;
  metadata: any;
  createdAt: Date;
  readAt: Date | null;
}

export interface ListFilters {
  status?: NotificationStatusFilter;
  type?: NotificationTypeFilter;
  cursor?: string;
  limit?: number;
}

export async function listForUser(
  userId: string,
  filters: ListFilters = {},
): Promise<{ rows: NotificationRow[]; nextCursor: string | null }> {
  const limit = filters.limit ?? 30;
  const where: any = { recipientId: userId };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.cursor) where.id = { lt: filters.cursor };

  // Archived'ni default'da yashirish
  if (!filters.status) where.status = { not: 'archived' };

  const rows = await prisma.notification.findMany({
    where,
    include: {
      sender: { select: { fullName: true, avatarUrl: true } },
      relatedCourse: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    rows: items.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      senderId: n.senderId,
      senderName: n.sender?.fullName ?? null,
      senderAvatarUrl: n.sender?.avatarUrl ?? null,
      type: n.type,
      title: n.title,
      message: n.message,
      status: n.status,
      relatedCourseId: n.relatedCourseId,
      relatedCourseTitle: n.relatedCourse?.title ?? null,
      relatedEntityId: n.relatedEntityId,
      metadata: n.metadata,
      createdAt: n.createdAt,
      readAt: n.readAt,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export async function findById(id: string): Promise<NotificationRow | null> {
  const n = await prisma.notification.findUnique({
    where: { id },
    include: {
      sender: { select: { fullName: true, avatarUrl: true } },
      relatedCourse: { select: { title: true } },
    },
  });
  if (!n) return null;
  return {
    id: n.id,
    recipientId: n.recipientId,
    senderId: n.senderId,
    senderName: n.sender?.fullName ?? null,
    senderAvatarUrl: n.sender?.avatarUrl ?? null,
    type: n.type,
    title: n.title,
    message: n.message,
    status: n.status,
    relatedCourseId: n.relatedCourseId,
    relatedCourseTitle: n.relatedCourse?.title ?? null,
    relatedEntityId: n.relatedEntityId,
    metadata: n.metadata,
    createdAt: n.createdAt,
    readAt: n.readAt,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { recipientId: userId, status: 'unread' },
  });
}

export async function markAsRead(id: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, recipientId: userId, status: 'unread' },
    data: { status: 'read', readAt: new Date() },
  });
}

export async function markManyAsRead(
  ids: string[],
  userId: string,
): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { id: { in: ids }, recipientId: userId, status: 'unread' },
    data: { status: 'read', readAt: new Date() },
  });
  return result.count;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { recipientId: userId, status: 'unread' },
    data: { status: 'read', readAt: new Date() },
  });
  return result.count;
}

export async function archive(id: string, userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { id, recipientId: userId },
    data: { status: 'archived' },
  });
}

export async function archiveAll(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { recipientId: userId, status: { not: 'archived' } },
    data: { status: 'archived' },
  });
  return result.count;
}

export async function deleteNotification(id: string, userId: string): Promise<void> {
  await prisma.notification.deleteMany({
    where: { id, recipientId: userId },
  });
}

export interface CountsByTypeRow {
  type: string;
  total: number;
  unread: number;
}

/**
 * Per-type stats — UI filter pills uchun count'lar.
 */
export async function getCountsByType(userId: string): Promise<CountsByTypeRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{ type: string; total: bigint; unread: bigint }>
  >`
    SELECT
      type::text AS type,
      COUNT(*)::bigint AS total,
      COUNT(*) FILTER (WHERE status = 'unread')::bigint AS unread
    FROM notifications
    WHERE recipient_id = ${userId}::uuid
      AND status != 'archived'
    GROUP BY type
    ORDER BY total DESC
  `;
  return rows.map((r) => ({
    type: r.type,
    total: Number(r.total),
    unread: Number(r.unread),
  }));
}
