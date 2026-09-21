'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import Avatar from '@/components/ui/Avatar';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';
import { Toolbar, SearchInput, FilterChips } from '@/components/ui/Toolbar';
import { toast } from '@/components/common/Toaster';
import {
  useAdminTickets,
  useAdminTicket,
  type TicketListItemDTO,
  type TicketDetailDTO,
  type TicketStatusDTO,
  type TicketPriorityDTO,
} from '@/hooks/queries/useAdminTickets';
import { useTicketReplyMutation, useTicketStatusMutation } from '@/hooks/mutations/useTicketMutations';
import { useI18n } from '@/contexts/I18nContext';
import { type Locale } from '@/lib/i18n';
import { formatDateTime } from '@/lib/i18n/format';

type StatusFilter = TicketStatusDTO | 'all';

const STATUS_VARIANT: Record<TicketStatusDTO, BadgeVariant> = {
  open: 'warning',
  in_progress: 'secondary',
  waiting_user: 'primary',
  resolved: 'success',
  closed: 'muted',
};
const STATUS_LABEL_KEY: Record<TicketStatusDTO, string> = {
  open: 'admin.ticketOpen',
  in_progress: 'admin.ticketInProgress',
  waiting_user: 'admin.ticketUserReply',
  resolved: 'admin.ticketResolved',
  closed: 'admin.ticketClosed',
};
const PRIORITY_COLOR: Record<TicketPriorityDTO, string> = {
  low: 'text-muted-foreground',
  normal: 'text-foreground',
  high: 'text-warning',
  urgent: 'text-destructive',
};
const CATEGORY_LABEL: Record<string, string> = {
  billing: 'categoryBilling',
  technical: 'categoryTechnical',
  course: 'categoryCourse',
  account: 'categoryAccount',
  other: 'categoryOther',
};

function fmtDateTime(iso: string, locale: Locale): string {
  return formatDateTime(iso, locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

const SupportTicketsPanel = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<StatusFilter>('open');
  const [search, setSearch] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useAdminTickets({ status, search: search || undefined });
  const detailQuery = useAdminTicket(activeTicketId);

  const tickets = data?.tickets ?? [];
  const stats = data?.stats;

  const firstTicketId = tickets[0]?.id ?? null;
  useEffect(() => {
    if (!activeTicketId && firstTicketId) setActiveTicketId(firstTicketId);
  }, [firstTicketId, activeTicketId]);

  const FILTERS: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'open', label: t('admin.ticketOpen'), count: stats?.open },
    { id: 'in_progress', label: t('admin.ticketInProgress'), count: stats?.in_progress },
    { id: 'waiting_user', label: t('admin.ticketUserReply'), count: stats?.waiting_user },
    { id: 'resolved', label: t('admin.ticketResolved'), count: stats?.resolved },
    { id: 'closed', label: t('admin.ticketClosed'), count: stats?.closed },
    { id: 'all', label: t('admin.statusAll') },
  ];

  return (
    <div className="space-y-4">
      {stats && (
        <StatCardGrid className="lg:grid-cols-5">
          <StatCard label={t('admin.total')} value={stats.total} icon="LifebuoyIcon" iconColor="text-foreground" />
          <StatCard label={t('admin.statusNew')} value={stats.open} icon="ClockIcon" iconColor="text-warning" />
          <StatCard label={t('admin.inProgress')} value={stats.in_progress + stats.waiting_user} icon="ChatBubbleLeftRightIcon" iconColor="text-secondary" />
          <StatCard label={t('admin.ticketResolved')} value={stats.resolved} icon="CheckCircleIcon" iconColor="text-success" />
          <StatCard label={t('admin.ticketClosed')} value={stats.closed} icon="LockClosedIcon" iconColor="text-muted-foreground" />
        </StatCardGrid>
      )}

      <Toolbar>
        <div className="overflow-x-auto -mx-1 px-1">
          <FilterChips options={FILTERS} value={status} onChange={setStatus} className="flex-nowrap" />
        </div>
        <SearchInput placeholder={t('admin.searchTicketPlaceholder')} onSearch={setSearch} />
      </Toolbar>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm text-destructive flex items-center justify-between">
          <span>{t('admin.error')}: {error.message}</span>
          <button onClick={() => refetch()} className="underline text-xs">{t('admin.retryBtn')}</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* List */}
        <div className="lg:col-span-1 bg-card rounded-lg border border-border overflow-hidden">
          <div className="p-3 border-b border-border">
            <p className="text-sm text-muted-foreground">{t('admin.tickets')} ({data?.total ?? 0})</p>
          </div>
          <div className="max-h-[620px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-16 bg-muted rounded" />)}</div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="LifebuoyIcon" size={40} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('admin.noTickets')}</p>
              </div>
            ) : (
              tickets.map((tk) => (
                <TicketRow key={tk.id} ticket={tk} active={activeTicketId === tk.id} onClick={() => setActiveTicketId(tk.id)} />
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 bg-card rounded-lg border border-border overflow-hidden">
          {detailQuery.isLoading ? (
            <div className="p-8"><div className="animate-pulse h-12 bg-muted rounded mb-4" /><div className="animate-pulse h-32 bg-muted rounded" /></div>
          ) : detailQuery.error ? (
            <div className="p-8 text-sm text-destructive">{detailQuery.error.message}</div>
          ) : detailQuery.data ? (
            <TicketDetail ticket={detailQuery.data.ticket} />
          ) : (
            <div className="p-8 text-center">
              <Icon name="LifebuoyIcon" size={40} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{t('admin.selectTicket')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function TicketRow({ ticket, active, onClick }: { ticket: TicketListItemDTO; active: boolean; onClick: () => void }) {
  const { t, locale } = useI18n();
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-border transition-smooth ${active ? 'bg-primary/5' : 'hover:bg-muted/40'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-sm text-foreground truncate flex-1">{ticket.subject}</p>
        {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
          <Icon name="ExclamationTriangleIcon" size={14} className={PRIORITY_COLOR[ticket.priority]} />
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate mb-1.5">
        {ticket.user.fullName} · {t(`admin.${CATEGORY_LABEL[ticket.category] ?? 'categoryOther'}`)}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={STATUS_VARIANT[ticket.status]}>{t(STATUS_LABEL_KEY[ticket.status])}</Badge>
        <span className="text-muted-foreground">{fmtDateTime(ticket.lastMessageAt, locale)}</span>
        <span className="text-muted-foreground ml-auto inline-flex items-center gap-1">
          <Icon name="ChatBubbleLeftIcon" size={12} />{ticket._count.messages}
        </span>
      </div>
    </button>
  );
}

function TicketDetail({ ticket }: { ticket: TicketDetailDTO }) {
  const { t, locale } = useI18n();
  const [reply, setReply] = useState('');
  const replyMut = useTicketReplyMutation();
  const statusMut = useTicketStatusMutation();

  useEffect(() => { setReply(''); }, [ticket.id]);

  const handleReply = () => {
    if (reply.trim().length === 0) return;
    replyMut.mutate({ ticketId: ticket.id, body: reply }, {
      onSuccess: () => { setReply(''); toast.success(t('admin.replySent')); },
      onError: (err) => toast.error(err.message),
    });
  };
  const handleStatus = (newStatus: TicketStatusDTO) => {
    statusMut.mutate({ ticketId: ticket.id, newStatus }, {
      onSuccess: () => toast.success(t('admin.statusChanged')),
      onError: (err) => toast.error(err.message),
    });
  };

  const isClosed = ticket.status === 'closed';

  return (
    <div className="flex flex-col h-full max-h-[680px]">
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-heading font-semibold text-foreground">{ticket.subject}</h3>
          <Badge variant={STATUS_VARIANT[ticket.status]}>{t(STATUS_LABEL_KEY[ticket.status])}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{ticket.user.fullName} · {ticket.user.email}</span>
          <span>{t(`admin.${CATEGORY_LABEL[ticket.category] ?? 'categoryOther'}`)}</span>
          <span className={`inline-flex items-center gap-1 ${PRIORITY_COLOR[ticket.priority]}`}>
            <Icon name="BoltIcon" size={12} />{t(`admin.priority${ticket.priority.charAt(0).toUpperCase()}${ticket.priority.slice(1)}`)}
          </span>
          <span>{fmtDateTime(ticket.createdAt, locale)}</span>
        </div>

        {!isClosed && (
          <div className="flex flex-wrap gap-2 mt-3">
            {ticket.status !== 'resolved' && (
              <Button variant="outline" size="sm" className="text-success border-success/30" iconLeft="CheckCircleIcon" loading={statusMut.isPending} onClick={() => handleStatus('resolved')}>
                {t('admin.resolved')}
              </Button>
            )}
            <Button variant="outline" size="sm" iconLeft="LockClosedIcon" loading={statusMut.isPending} onClick={() => handleStatus('closed')}>
              {t('admin.closeTicket')}
            </Button>
          </div>
        )}
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ticket.messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.isAdminReply ? 'flex-row-reverse' : ''}`}>
            {msg.isAdminReply ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                <Icon name="ShieldCheckIcon" size={16} className="text-primary" />
              </div>
            ) : (
              <Avatar name={msg.author.fullName} size={32} />
            )}
            <div className={`max-w-[80%] rounded-lg p-3 ${msg.isAdminReply ? 'bg-primary/10' : 'bg-muted/50'}`}>
              <div className="flex items-center gap-2 mb-1 text-xs">
                <span className="font-medium text-foreground">{msg.author.fullName}</span>
                <span className="text-muted-foreground">{fmtDateTime(msg.createdAt, locale)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply */}
      {!isClosed && (
        <div className="p-4 border-t border-border shrink-0">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder={t('admin.replyPlaceholder')}
            className="w-full p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-card"
          />
          <div className="flex justify-end mt-2">
            <Button variant="primary" size="sm" iconLeft="PaperAirplaneIcon" loading={replyMut.isPending} disabled={reply.trim().length === 0} onClick={handleReply}>
              {t('admin.sendReply')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportTicketsPanel;
