'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { SkeletonDetail } from '@/components/ui/Skeleton';
import { toast } from '@/components/common/Toaster';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTicket,
  type TicketStatusDTO,
} from '@/hooks/queries/useSupportTickets';
import { useReplyToTicketMutation } from '@/hooks/mutations/useUserTicketMutations';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

const STATUS_META: Record<TicketStatusDTO, { key: string; color: string }> = {
  open: { key: 'support.statusOpen', color: 'bg-primary/10 text-primary' },
  in_progress: { key: 'support.statusInProgress', color: 'bg-warning/10 text-warning' },
  waiting_user: { key: 'support.statusWaitingUser', color: 'bg-secondary/10 text-secondary' },
  resolved: { key: 'support.statusResolved', color: 'bg-success/10 text-success' },
  closed: { key: 'support.statusClosed', color: 'bg-muted text-muted-foreground' },
};

function timeOfDay(iso: string, locale: Locale): string {
  return formatDateTime(iso, locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  ticketId: string;
}

export default function TicketDetailClient({ ticketId }: Props) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { data, isLoading, error } = useTicket(ticketId);
  const replyMut = useReplyToTicketMutation(ticketId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const ticket = data?.ticket;
  const messages = ticket?.messages ?? [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (text.length < 2) return toast.error(t('support.errReplyMin'));
    replyMut.mutate(text, {
      onSuccess: () => setDraft(''),
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading || !ticket)
    return (
      <div className="max-w-3xl mx-auto p-6">
        <SkeletonDetail />
      </div>
    );
  if (error)
    return <div className="p-8 text-destructive">{(error as Error).message}</div>;

  const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';
  const myId = user?.id ?? '';

  return (
    <div className="max-w-3xl mx-auto p-6 h-screen flex flex-col">
      <Link
        href="/support/tickets"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="ArrowLeftIcon" size={14} />
        {t('support.ticketsLink')}
      </Link>

      <div className="bg-card border border-border rounded-md p-4 mb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-heading font-semibold">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground">
              {ticket.category} · {ticket.priority} · {timeOfDay(ticket.createdAt, locale)}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full shrink-0 ${
              STATUS_META[ticket.status].color
            }`}
          >
            {t(STATUS_META[ticket.status].key)}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-card border border-border rounded-md p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground italic text-sm py-8">
            {t('support.noMessages')}
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.authorId === myId;
            const isAdmin = m.isAdminReply;
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {!isMine && (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shrink-0 ${
                      isAdmin
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {m.author.fullName.charAt(0)}
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : isAdmin
                      ? 'bg-primary/10 text-foreground rounded-bl-sm border border-primary/30'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  {!isMine && (
                    <p
                      className={`text-[10px] font-medium mb-1 ${
                        isAdmin ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {m.author.fullName}
                      {isAdmin && ` · ${t('support.adminLabel')}`}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {timeOfDay(m.createdAt, locale)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isClosed ? (
        <div className="mt-3 bg-muted/30 text-muted-foreground rounded-md p-4 text-center text-sm">
          {t('support.thisTicket')}{' '}
          {ticket.status === 'resolved' ? t('support.closedResolved') : t('support.closedClosed')}.{' '}
          {t('support.newProblemPrompt')}{' '}
          <Link href="/support/tickets/new" className="text-primary hover:underline">
            {t('support.newTicketLink')}
          </Link>{' '}
          {t('support.sendVerb')}
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="mt-3 bg-card border border-border rounded-md p-3 flex items-center gap-2"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('support.replyPlaceholder')}
            className="flex-1 px-3 py-2 bg-muted/30 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!draft.trim() || replyMut.isPending}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
            aria-label={t('support.submit')}
          >
            {replyMut.isPending ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="PaperAirplaneIcon" size={16} />
            )}
          </button>
        </form>
      )}
    </div>
  );
}
