'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import {
  useNotifications,
  type NotificationDTO,
  type NotificationTypeDTO,
  type NotificationStatusDTO,
} from '@/hooks/queries/useNotifications';
import { useI18n } from '@/contexts/I18nContext';
import {
  useMarkReadMutation,
  useMarkAllReadMutation,
  useArchiveNotificationMutation,
  useDeleteNotificationMutation,
} from '@/hooks/mutations/useNotificationMutations';

export default function NotificationsClient() {
  const { t } = useI18n();

  const TYPE_LABEL: Record<NotificationTypeDTO, { label: string; icon: string; color: string }> = {
    enrollment: { label: t('notifications.enrollment'), icon: 'UserPlusIcon', color: 'text-primary' },
    quiz_completion: { label: t('notifications.quizCompletion'), icon: 'AcademicCapIcon', color: 'text-success' },
    assignment_submission: {
      label: t('notifications.assignment'),
      icon: 'ClipboardDocumentListIcon',
      color: 'text-warning',
    },
    course_update: { label: t('notifications.courseUpdate'), icon: 'BookOpenIcon', color: 'text-secondary' },
    achievement: { label: t('notifications.achievement'), icon: 'TrophyIcon', color: 'text-warning' },
    payment: { label: t('notifications.payment'), icon: 'CurrencyDollarIcon', color: 'text-success' },
  };

  function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return t('notifications.now');
    if (mins < 60) return `${mins} ${t('notifications.minAgo')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${t('notifications.hoursAgo')}`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${t('notifications.daysAgo')}`;
    return new Date(iso).toLocaleDateString('uz-UZ');
  }

  function groupByDate(rows: NotificationDTO[]): Map<string, NotificationDTO[]> {
    const groups = new Map<string, NotificationDTO[]>();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86_400_000;
    const weekAgo = today - 7 * 86_400_000;

    for (const r of rows) {
      const ts = new Date(r.createdAt).getTime();
      let bucket: string;
      if (ts >= today) bucket = t('notifications.today');
      else if (ts >= yesterday) bucket = t('notifications.yesterday');
      else if (ts >= weekAgo) bucket = t('notifications.thisWeek');
      else bucket = t('notifications.older');
      if (!groups.has(bucket)) groups.set(bucket, []);
      groups.get(bucket)!.push(r);
    }
    return groups;
  }
  const [statusFilter, setStatusFilter] = useState<NotificationStatusDTO | undefined>();
  const [typeFilter, setTypeFilter] = useState<NotificationTypeDTO | undefined>();
  const { data, isLoading, error } = useNotifications({
    status: statusFilter,
    type: typeFilter,
  });

  const markReadMut = useMarkReadMutation();
  const markAllMut = useMarkAllReadMutation();
  const archiveMut = useArchiveNotificationMutation();
  const deleteMut = useDeleteNotificationMutation();

  const rows = data?.rows ?? [];
  const groups = groupByDate(rows);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            {t('nav.home')}
          </Link>
          <h1 className="text-2xl font-heading font-semibold">
            {t('notifications.title')}
            {(data?.unreadCount ?? 0) > 0 && (
              <span className="ml-2 text-sm font-normal text-primary">
                ({data?.unreadCount} {t('notifications.unread')})
              </span>
            )}
          </h1>
        </div>
        {(data?.unreadCount ?? 0) > 0 && (
          <button
            onClick={() =>
              markAllMut.mutate(undefined, {
                onSuccess: ({ updated }) =>
                  toast.success(`${updated} ${t('notifications.markedAsRead')}`),
                onError: (err) => toast.error(err.message),
              })
            }
            disabled={markAllMut.isPending}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Icon name="CheckCircleIcon" size={14} />
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(
          [
            { value: undefined, label: t('common.all') },
            { value: 'unread', label: t('notifications.statusUnread') },
            { value: 'read', label: t('notifications.statusRead') },
            { value: 'archived', label: t('notifications.statusArchived') },
          ] as const
        ).map((s) => (
          <button
            key={s.label}
            onClick={() => setStatusFilter(s.value)}
            className={`px-3 py-1.5 rounded-full text-xs ${
              statusFilter === s.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {(data?.countsByType.length ?? 0) > 0 && (
        <div className="flex items-center gap-1 mb-4 flex-wrap">
          <button
            onClick={() => setTypeFilter(undefined)}
            className={`px-2.5 py-1 rounded-full text-xs ${
              !typeFilter
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {t('notifications.allTypes')}
          </button>
          {data?.countsByType.map((c) => {
            const label = TYPE_LABEL[c.type as NotificationTypeDTO]?.label ?? c.type;
            return (
              <button
                key={c.type}
                onClick={() => setTypeFilter(c.type as NotificationTypeDTO)}
                className={`px-2.5 py-1 rounded-full text-xs flex items-center gap-1 ${
                  typeFilter === c.type
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                {label}
                <span className="text-[10px] opacity-70">({c.total})</span>
                {c.unread > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-1.5 text-[9px]">
                    {c.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 text-sm">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-20 bg-muted rounded-md" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-md">
          <Icon name="BellIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('notifications.noNotifications')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(groups.entries()).map(([bucket, items]) => (
            <div key={bucket}>
              <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {bucket}
              </h2>
              <div className="space-y-1.5">
                {items.map((n) => (
                  <NotificationCard
                    key={n.id}
                    notification={n}
                    onMarkRead={() => markReadMut.mutate(n.id)}
                    onArchive={() =>
                      archiveMut.mutate(n.id, {
                        onSuccess: () => toast.success(t('notifications.archived')),
                        onError: (err) => toast.error(err.message),
                      })
                    }
                    onDelete={() =>
                      deleteMut.mutate(n.id, {
                        onSuccess: () => toast.success(t('notifications.deleted')),
                        onError: (err) => toast.error(err.message),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  notification,
  onMarkRead,
  onArchive,
  onDelete,
}: {
  notification: NotificationDTO;
  onMarkRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();

  const TYPE_LABEL: Record<NotificationTypeDTO, { label: string; icon: string; color: string }> = {
    enrollment: { label: t('notifications.enrollment'), icon: 'UserPlusIcon', color: 'text-primary' },
    quiz_completion: { label: t('notifications.quizCompletion'), icon: 'AcademicCapIcon', color: 'text-success' },
    assignment_submission: {
      label: t('notifications.assignment'),
      icon: 'ClipboardDocumentListIcon',
      color: 'text-warning',
    },
    course_update: { label: t('notifications.courseUpdate'), icon: 'BookOpenIcon', color: 'text-secondary' },
    achievement: { label: t('notifications.achievement'), icon: 'TrophyIcon', color: 'text-warning' },
    payment: { label: t('notifications.payment'), icon: 'CurrencyDollarIcon', color: 'text-success' },
  };

  const isUnread = notification.status === 'unread';
  const typeMeta = TYPE_LABEL[notification.type] ?? TYPE_LABEL.course_update;
  const handleClick = () => {
    if (isUnread) onMarkRead();
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-card border rounded-md p-3 flex items-start gap-3 cursor-pointer hover:shadow-warm-md transition-smooth ${
        isUnread ? 'border-primary/30 bg-primary/5' : 'border-border'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 ${typeMeta.color}`}
      >
        <Icon name={typeMeta.icon} size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <p className="font-medium text-foreground truncate">
              {notification.title}
            </p>
            {isUnread && (
              <span className="w-2 h-2 bg-primary rounded-full shrink-0" />
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {timeAgo(notification.createdAt)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
          {notification.message}
        </p>
        {notification.relatedCourseTitle && (
          <p className="text-xs text-primary mt-1">
            📚 {notification.relatedCourseTitle}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2">
          {isUnread && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead();
              }}
              className="text-xs text-primary hover:underline"
            >
              {t('notifications.markAsRead')}
            </button>
          )}
          {notification.status !== 'archived' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive();
              }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('notifications.archive')}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-xs text-destructive hover:underline ml-auto"
          >
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
