'use client';

import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/AppIcon';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  relatedCourseId?: string | null;
  relatedEntityId?: string | null;
}

interface NotificationBellProps {
  userId: string;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Notifications fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchNotifications();
    // Poll every 60 seconds for new notifications
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: [notificationId] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, status: 'read' as const } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'read' as const })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return 'UserPlusIcon';
      case 'quiz_completion':
        return 'CheckCircleIcon';
      case 'assignment_submission':
        return 'DocumentTextIcon';
      case 'course_update':
        return 'BellIcon';
      case 'achievement':
        return 'TrophyIcon';
      case 'payment':
        return 'CreditCardIcon';
      default:
        return 'BellIcon';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Hozir';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} daqiqa oldin`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} soat oldin`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} kun oldin`;
    return date.toLocaleDateString('uz-UZ');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-foreground hover:bg-muted rounded-md transition-smooth"
        aria-label="Bildirishnomalar"
      >
        <Icon name="BellIcon" size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-destructive-foreground bg-destructive rounded-full px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-popover rounded-md shadow-warm-xl border border-border z-200 max-h-[600px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-base font-heading font-semibold text-foreground">
              Bildirishnomalar
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-primary hover:underline font-medium"
              >
                Barchasini o'qilgan qilish
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Icon name="BellIcon" size={40} className="mb-2 opacity-40" />
                <p className="text-sm">Bildirishnomalar yo'q</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                      notification.status === 'unread' ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      if (notification.status === 'unread') {
                        handleMarkAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                          notification.type === 'enrollment'
                            ? 'bg-success/10 text-success'
                            : notification.type === 'quiz_completion'
                            ? 'bg-primary/10 text-primary'
                            : notification.type === 'assignment_submission'
                            ? 'bg-secondary/10 text-secondary'
                            : notification.type === 'payment'
                            ? 'bg-accent/20 text-accent-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon name={getNotificationIcon(notification.type)} size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                            {notification.title}
                          </h4>
                          {notification.status === 'unread' && (
                            <span className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[11px] text-muted-foreground/70 mt-1.5">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
