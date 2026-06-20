'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import { useAuth } from '@/contexts/AuthContext';
import {
  useTicket,
  type TicketStatusDTO,
} from '@/hooks/queries/useSupportTickets';
import { useReplyToTicketMutation } from '@/hooks/mutations/useUserTicketMutations';
import { useI18n } from '@/contexts/I18nContext';

const STATUS_LABEL: Record<TicketStatusDTO, { label: string; color: string }> = {
  open: { label: 'Ochiq', color: 'bg-primary/10 text-primary' },
  in_progress: { label: 'Jarayonda', color: 'bg-warning/10 text-warning' },
  waiting_user: { label: 'Sizdan kutilmoqda', color: 'bg-secondary/10 text-secondary' },
  resolved: { label: 'Hal qilingan', color: 'bg-success/10 text-success' },
  closed: { label: 'Yopilgan', color: 'bg-muted text-muted-foreground' },
};

function timeOfDay(iso: string): string {
  return new Date(iso).toLocaleString('uz-UZ', {
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
  const { t } = useI18n();
    e.preventDefault();
    const text = draft.trim();
    if (text.length < 2) return toast.error("Xabar kamida 2 belgi");
    replyMut.mutate(text, {
      onSuccess: () => setDraft(''),
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading || !ticket) return <div className="p-8">{t('common.loading')}</div>;
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
        Murojaatlar
      </Link>

      <div className="bg-card border border-border rounded-md p-4 mb-3">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-heading font-semibold">{ticket.subject}</h1>
            <p className="text-xs text-muted-foreground">
              {ticket.category} · {ticket.priority} · {timeOfDay(ticket.createdAt)}
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full shrink-0 ${
              STATUS_LABEL[ticket.status].color
            }`}
          >
            {STATUS_LABEL[ticket.status].label}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-card border border-border rounded-md p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground italic text-sm py-8">
            Xabar yo'q
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
                      {isAdmin && ' · Admin'}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}
                  >
                    {timeOfDay(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isClosed ? (
        <div className="mt-3 bg-muted/30 text-muted-foreground rounded-md p-4 text-center text-sm">
          Bu murojaat {ticket.status === 'resolved' ? 'hal qilindi' : 'yopildi'}.
          Yangi muammo bo'lsa,{' '}
          <Link href="/support/tickets/new" className="text-primary hover:underline">
            yangi murojaat
          </Link>{' '}
          yuboring.
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
            placeholder="Javob yozing…"
            className="flex-1 px-3 py-2 bg-muted/30 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!draft.trim() || replyMut.isPending}
            className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
            aria-label="Yuborish"
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
