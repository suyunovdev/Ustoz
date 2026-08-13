'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import {
  useMyTickets,
  type TicketStatusDTO,
  type TicketPriorityDTO,
} from '@/hooks/queries/useSupportTickets';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

const STATUS_META: Record<TicketStatusDTO, { key: string; color: string }> = {
  open: { key: 'support.statusOpen', color: 'bg-primary/10 text-primary' },
  in_progress: { key: 'support.statusInProgress', color: 'bg-warning/10 text-warning' },
  waiting_user: { key: 'support.statusWaitingUser', color: 'bg-secondary/10 text-secondary' },
  resolved: { key: 'support.statusResolved', color: 'bg-success/10 text-success' },
  closed: { key: 'support.statusClosed', color: 'bg-muted text-muted-foreground' },
};

const PRIORITY_BADGE: Record<TicketPriorityDTO, string> = {
  low: 'bg-muted/50 text-muted-foreground',
  normal: 'bg-secondary/10 text-secondary',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

type TFn = (key: string, params?: Record<string, string | number>) => string;

function timeAgo(iso: string, locale: Locale, t: TFn): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return t('support.timeToday');
  if (days === 1) return t('support.timeYesterday');
  if (days < 7) return t('support.timeDaysAgo', { count: days });
  if (days < 30) return t('support.timeWeeksAgo', { count: Math.floor(days / 7) });
  return formatDate(iso, locale);
}

export default function TicketsListClient() {
  const { t, locale } = useI18n();
  const { data, isLoading, error } = useMyTickets();
  const tickets = data?.tickets ?? [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/help"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            {t('support.helpCenter')}
          </Link>
          <h1 className="text-2xl font-heading font-semibold">{t('support.myTickets')}</h1>
          <p className="text-sm text-muted-foreground">{t('support.ticketCount', { count: tickets.length })}</p>
        </div>
        <Link
          href="/support/tickets/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="PlusIcon" size={16} />
          {t('support.newTicket')}
        </Link>
      </div>

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
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-md">
          <Icon
            name="ChatBubbleLeftRightIcon"
            size={48}
            className="text-muted-foreground mx-auto mb-3"
          />
          <p className="text-muted-foreground mb-3">{t('support.empty')}</p>
          <Link
            href="/support/tickets/new"
            className="text-primary hover:underline text-sm"
          >
            {t('support.sendFirst')}
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => {
            const status = STATUS_META[ticket.status];
            const isWaitingUser = ticket.status === 'waiting_user';
            return (
              <Link
                key={ticket.id}
                href={`/support/tickets/${ticket.id}`}
                className={`block bg-card border rounded-md p-4 hover:shadow-warm-md transition-smooth ${
                  isWaitingUser
                    ? 'border-secondary/40 bg-secondary/5'
                    : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-foreground truncate">
                        {ticket.subject}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${status.color}`}
                      >
                        {t(status.key)}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          PRIORITY_BADGE[ticket.priority]
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ticket.category} · {t('support.messagesCount', { count: ticket._count.messages })} · {t('support.last')}{' '}
                      {timeAgo(ticket.lastMessageAt, locale, t)}
                    </p>
                  </div>
                  <Icon
                    name="ChevronRightIcon"
                    size={14}
                    className="text-muted-foreground shrink-0 mt-1"
                  />
                </div>
                {isWaitingUser && (
                  <p className="text-xs text-secondary font-medium mt-1">
                    💬 {t('support.waitingYourReply')}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
