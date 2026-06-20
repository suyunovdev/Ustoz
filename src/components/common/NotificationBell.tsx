'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { useNotifications } from '@/hooks/queries/useNotifications';
import {
  useMarkReadMutation,
  useMarkAllReadMutation,
} from '@/hooks/mutations/useNotificationMutations';
import type { NotificationTypeDTO } from '@/hooks/queries/useNotifications';

interface NotificationBellProps {
  userId: string;
}

const TYPE_ICON: Record<NotificationTypeDTO, string> = {
  enrollment: 'UserPlusIcon',
  quiz_completion: 'AcademicCapIcon',
  assignment_submission: 'ClipboardDocumentListIcon',
  course_update: 'BookOpenIcon',
  achievement: 'TrophyIcon',
  payment: 'CurrencyDollarIcon',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'hozir';
  if (mins < 60) return `${mins}d`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}s`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}k`;
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: 'numeric',
    month: 'short',
  });
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  const markReadMut = useMarkReadMutation();
  const markAllMut = useMarkAllReadMutation();

  const notifications = (data?.rows ?? []).slice(0, 10);
  const unreadCount = data?.unreadCount ?? 0;

  useEffect(() => {
    if (!isOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isOpen]);

  if (!userId) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="relative p-2 hover:bg-muted rounded-md transition-smooth"
        aria-label={t('ui.notifications')}
      >
        <Icon name="BellIcon" size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-md shadow-warm-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-medium text-foreground">
              {t('ui.notifications')}
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-normal text-primary">
                  ({unreadCount} {t('ui.newCount')})
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMut.mutate()}
                disabled={markAllMut.isPending}
                className="text-xs text-primary hover:underline disabled:opacity-50"
              >
                {t('ui.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-12 bg-muted rounded" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground italic">
                {t('ui.noNotifications')}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {notifications.map((n) => {
                  const isUnread = n.status === 'unread';
                  const icon = TYPE_ICON[n.type] ?? 'BellIcon';
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => {
                          if (isUnread) markReadMut.mutate(n.id);
                        }}
                        className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex items-start gap-2 ${
                          isUnread ? 'bg-primary/5' : ''
                        }`}
                      >
                        <Icon
                          name={icon}
                          size={16}
                          className={isUnread ? 'text-primary mt-0.5' : 'text-muted-foreground mt-0.5'}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {n.title}
                            </p>
                            {isUnread && (
                              <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-border p-2">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-primary hover:underline py-1.5"
            >
              {t('ui.viewAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
