'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import {
  useAdminTickets,
  useAdminTicket,
  type TicketListItemDTO,
  type TicketStatusDTO,
  type TicketPriorityDTO,
} from '@/hooks/queries/useAdminTickets';
import {
  useTicketReplyMutation,
  useTicketStatusMutation,
} from '@/hooks/mutations/useTicketMutations';

type StatusFilter = TicketStatusDTO | 'all';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'open', label: 'ticketOpen' },
  { id: 'in_progress', label: 'ticketInProgress' },
  { id: 'waiting_user', label: 'ticketWaitingUser' },
  { id: 'resolved', label: 'ticketResolved' },
  { id: 'closed', label: 'ticketClosed' },
  { id: 'all', label: 'filterAll' },
];

const STATUS_BADGE: Record<TicketStatusDTO, { label: string; color: string }> = {
  open: { label: 'ticketOpen', color: 'bg-warning/10 text-warning' },
  in_progress: { label: 'ticketInProgress', color: 'bg-secondary/10 text-secondary' },
  waiting_user: { label: 'ticketUserReply', color: 'bg-primary/10 text-primary' },
  resolved: { label: 'ticketResolved', color: 'bg-success/10 text-success' },
  closed: { label: 'ticketClosed', color: 'bg-muted text-muted-foreground' },
};

const PRIORITY_BADGE: Record<TicketPriorityDTO, { label: string; color: string }> = {
  low: { label: 'priorityLow', color: 'text-muted-foreground' },
  normal: { label: 'priorityNormal', color: 'text-foreground' },
  high: { label: 'priorityHigh', color: 'text-warning' },
  urgent: { label: 'priorityUrgent', color: 'text-destructive' },
};

const CATEGORY_LABEL: Record<string, string> = {
  billing: 'categoryBilling',
  technical: 'categoryTechnical',
  course: 'categoryCourse',
  account: 'categoryAccount',
  other: 'categoryOther',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const SupportTicketsPanel = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<StatusFilter>('open');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, error, refetch } = useAdminTickets({
    status,
    search: search || undefined,
  });
  const detailQuery = useAdminTicket(activeTicketId);

  const tickets = data?.tickets ?? [];
  const stats = data?.stats;

  // Birinchi marta list yuklanganda eng yuqoridagi ticket'ni ochib qo'yamiz
  useEffect(() => {
    if (!activeTicketId && tickets.length > 0) {
      setActiveTicketId(tickets[0].id);
    }
  }, [tickets, activeTicketId]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label={t('admin.total')} value={stats.total} icon="LifebuoyIcon" color="text-foreground" />
          <StatCard label={t('admin.statusNew')} value={stats.open} icon="ClockIcon" color="text-warning" />
          <StatCard label={t('admin.inProgress')} value={stats.in_progress + stats.waiting_user} icon="ChatBubbleLeftRightIcon" color="text-secondary" />
          <StatCard label={t('admin.ticketResolved')} value={stats.resolved} icon="CheckCircleIcon" color="text-success" />
          <StatCard label={t('admin.ticketClosed')} value={stats.closed} icon="LockClosedIcon" color="text-muted-foreground" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-md shadow-warm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 flex-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatus(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-smooth ${
                  status === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {t(`admin.${tab.label}`)}
              </button>
            ))}
          </div>

          <div className="relative flex-1 lg:flex-none">
            <Icon
              name="MagnifyingGlassIcon"
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('admin.searchTicketPlaceholder')}
              className="pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-64"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm text-destructive flex items-center justify-between">
          <span>{t('admin.error')}: {error.message}</span>
          <button onClick={() => refetch()} className="underline text-xs">
            {t('admin.retryBtn')}
          </button>
        </div>
      )}

      {/* Master-detail layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List (sidebar) */}
        <div className="lg:col-span-1 bg-card rounded-md shadow-warm">
          <div className="p-4 border-b border-border">
            <p className="text-sm text-muted-foreground">
              {t('admin.tickets')} ({data?.total ?? 0})
            </p>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="LifebuoyIcon" size={40} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">{t('admin.noTickets')}</p>
              </div>
            ) : (
              <div>
                {tickets.map((t) => (
                  <TicketRow
                    key={t.id}
                    ticket={t}
                    active={activeTicketId === t.id}
                    onClick={() => setActiveTicketId(t.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 bg-card rounded-md shadow-warm">
          {detailQuery.isLoading ? (
            <div className="p-8">
              <div className="animate-pulse h-12 bg-muted rounded mb-4" />
              <div className="animate-pulse h-32 bg-muted rounded" />
            </div>
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

function TicketRow({
  ticket,
  active,
  onClick,
}: {
  ticket: TicketListItemDTO;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const priority = PRIORITY_BADGE[ticket.priority];
  const status = STATUS_BADGE[ticket.status];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border-b border-border hover:bg-muted/40 transition-smooth ${
        active ? 'bg-primary/10' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="font-medium text-sm text-foreground truncate flex-1">
          {ticket.subject}
        </p>
        {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
          <Icon name="ExclamationTriangleIcon" size={14} className={priority.color} />
        )}
      </div>
      <p className="text-xs text-muted-foreground truncate mb-1">
        {ticket.user.fullName} · {t(`admin.${CATEGORY_LABEL[ticket.category]}`) ?? ticket.category}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className={`px-2 py-0.5 rounded-full ${status.color}`}>{t(`admin.${status.label}`)}</span>
        <span className="text-muted-foreground">{formatDateTime(ticket.lastMessageAt)}</span>
        <span className="text-muted-foreground ml-auto">💬 {ticket._count.messages}</span>
      </div>
    </button>
  );
}

import type { TicketDetailDTO } from '@/hooks/queries/useAdminTickets';
import { useI18n } from '@/contexts/I18nContext';

function TicketDetail({ ticket }: { ticket: TicketDetailDTO }) {
  const { t } = useI18n();
  const [reply, setReply] = useState('');
  const replyMut = useTicketReplyMutation();
  const statusMut = useTicketStatusMutation();

  useEffect(() => {
    setReply('');
  }, [ticket.id]);

  const handleReply = () => {
    if (reply.trim().length === 0) return;
    replyMut.mutate(
      { ticketId: ticket.id, body: reply },
      {
        onSuccess: () => {
          setReply('');
          toast.success(t('admin.replySent'));
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleStatus = (newStatus: TicketStatusDTO) => {
    statusMut.mutate(
      { ticketId: ticket.id, newStatus },
      {
        onSuccess: () => toast.success(t('admin.statusChanged')),
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const statusBadge = STATUS_BADGE[ticket.status];
  const priorityBadge = PRIORITY_BADGE[ticket.priority];
  const isClosed = ticket.status === 'closed';

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-heading font-semibold text-foreground">
            {ticket.subject}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
            {t(`admin.${statusBadge.label}`)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{ticket.user.fullName} · {ticket.user.email}</span>
          <span>{CATEGORY_LABEL[ticket.category] ?? ticket.category}</span>
          <span className={priorityBadge.color}>⚡ {t(`admin.${priorityBadge.label}`)}</span>
          <span>📅 {formatDateTime(ticket.createdAt)}</span>
        </div>

        {!isClosed && (
          <div className="flex flex-wrap gap-2 mt-3">
            {ticket.status !== 'resolved' && (
              <button
                onClick={() => handleStatus('resolved')}
                disabled={statusMut.isPending}
                className="text-xs px-3 py-1.5 rounded-md border border-success/30 text-success hover:bg-success/10 transition-smooth disabled:opacity-50 flex items-center gap-1"
              >
                <Icon name="CheckCircleIcon" size={14} />
                {t('admin.resolved')}
              </button>
            )}
            <button
              onClick={() => handleStatus('closed')}
              disabled={statusMut.isPending}
              className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground hover:bg-muted transition-smooth disabled:opacity-50 flex items-center gap-1"
            >
              <Icon name="LockClosedIcon" size={14} />
              {t('admin.closeTicket')}
            </button>
          </div>
        )}
      </div>

      {/* Messages thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.isAdminReply ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ${
                msg.isAdminReply ? 'bg-primary/10' : 'bg-muted'
              }`}
            >
              <Icon
                name={msg.isAdminReply ? 'ShieldCheckIcon' : 'UserIcon'}
                size={16}
                className={msg.isAdminReply ? 'text-primary' : 'text-foreground'}
              />
            </div>
            <div
              className={`max-w-[80%] rounded-md p-3 ${
                msg.isAdminReply ? 'bg-primary/10' : 'bg-muted/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 text-xs">
                <span className="font-medium text-foreground">{msg.author.fullName}</span>
                <span className="text-muted-foreground">{formatDateTime(msg.createdAt)}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap break-words">{msg.body}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Reply box */}
      {!isClosed && (
        <div className="p-4 border-t border-border">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder={t('admin.replyPlaceholder')}
            className="w-full p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleReply}
              disabled={replyMut.isPending || reply.trim().length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {replyMut.isPending && (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              <Icon name="PaperAirplaneIcon" size={14} />
              {t('admin.sendReply')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-md shadow-warm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon name={icon} size={18} className={color} />
      </div>
      <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
    </div>
  );
}

export default SupportTicketsPanel;
