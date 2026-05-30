'use client';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import {
  useMyTickets,
  type TicketStatusDTO,
  type TicketPriorityDTO,
} from '@/hooks/queries/useSupportTickets';

const STATUS_LABEL: Record<TicketStatusDTO, { label: string; color: string }> = {
  open: { label: 'Ochiq', color: 'bg-primary/10 text-primary' },
  in_progress: { label: 'Jarayonda', color: 'bg-warning/10 text-warning' },
  waiting_user: { label: 'Sizdan kutilmoqda', color: 'bg-secondary/10 text-secondary' },
  resolved: { label: 'Hal qilingan', color: 'bg-success/10 text-success' },
  closed: { label: 'Yopilgan', color: 'bg-muted text-muted-foreground' },
};

const PRIORITY_BADGE: Record<TicketPriorityDTO, string> = {
  low: 'bg-muted/50 text-muted-foreground',
  normal: 'bg-secondary/10 text-secondary',
  high: 'bg-warning/10 text-warning',
  urgent: 'bg-destructive/10 text-destructive',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return 'bugun';
  if (days === 1) return 'kecha';
  if (days < 7) return `${days} kun oldin`;
  if (days < 30) return `${Math.floor(days / 7)} hafta oldin`;
  return new Date(iso).toLocaleDateString('uz-UZ');
}

export default function TicketsListClient() {
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
            Yordam markazi
          </Link>
          <h1 className="text-2xl font-heading font-semibold">Mening murojaatlarim</h1>
          <p className="text-sm text-muted-foreground">{tickets.length} ta murojaat</p>
        </div>
        <Link
          href="/support/tickets/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="PlusIcon" size={16} />
          Yangi murojaat
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
          <p className="text-muted-foreground mb-3">Hali murojaat yo'q</p>
          <Link
            href="/support/tickets/new"
            className="text-primary hover:underline text-sm"
          >
            Birinchi murojaatni yuboring →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((t) => {
            const status = STATUS_LABEL[t.status];
            const isWaitingUser = t.status === 'waiting_user';
            return (
              <Link
                key={t.id}
                href={`/support/tickets/${t.id}`}
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
                        {t.subject}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${status.color}`}
                      >
                        {status.label}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          PRIORITY_BADGE[t.priority]
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.category} · {t._count.messages} ta xabar · oxirgi{' '}
                      {timeAgo(t.lastMessageAt)}
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
                    💬 Sizning javobingiz kutilmoqda
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
