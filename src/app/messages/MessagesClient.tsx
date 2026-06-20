'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';
import { toast } from '@/components/common/Toaster';
import { useAuth } from '@/contexts/AuthContext';
import {
  useConversations,
  useConversationMessages,
  type ConversationListItemDTO,
} from '@/hooks/queries/useConversations';
import { useSendMessageMutation } from '@/hooks/mutations/useConversationMutations';
import { useI18n } from '@/contexts/I18nContext';

function timeOfDay(d: string): string {
  return new Date(d).toLocaleTimeString('uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MessagesClient() {
  const { t } = useI18n();
  const { user } = useAuth();

  function timeAgo(d: string): string {
    const ms = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60_000);
    if (mins < 1) return t('messages.now');
    if (mins < 60) return `${mins} ${t('messages.min')}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ${t('messages.hour')}`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${t('messages.day')}`;
    return new Date(d).toLocaleDateString('uz-UZ');
  }
  const searchParams = useSearchParams();
  const deepLinkId = searchParams.get('c');
  const inbox = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkId);
  const [search, setSearch] = useState('');

  const conversations = inbox.data?.conversations ?? [];

  // Deep link: ?c=id'dan suhbatni ochish
  useEffect(() => {
    if (deepLinkId) setSelectedId(deepLinkId);
  }, [deepLinkId]);

  // Select first conversation by default (desktop)
  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations.length, selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.partnerName.toLowerCase().includes(q) ||
        c.partnerEmail.toLowerCase().includes(q),
    );
  }, [conversations, search]);

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <Link
            href={user?.role === 'teacher' ? '/teacher-dashboard' : '/student-dashboard'}
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1"
          >
            <Icon name="ArrowLeftIcon" size={14} />
            Dashboard
          </Link>
          <h1 className="text-2xl font-heading font-semibold">
            {t('messages.title')}
            {(inbox.data?.totalUnread ?? 0) > 0 && (
              <span className="ml-2 text-sm font-normal text-primary">
                ({inbox.data?.totalUnread} {t('messages.unread')})
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-full">
        <div className="bg-card border border-border rounded-md overflow-hidden flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Icon
                name="MagnifyingGlassIcon"
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('messages.searchConversation')}
                className="w-full pl-9 pr-3 py-2 bg-muted/30 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {inbox.isLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-muted rounded-md" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm italic p-8">
                {search ? t('messages.noMatchingConversation') : t('messages.noConversations')}
              </p>
            ) : (
              <ul>
                {filtered.map((c) => (
                  <li key={c.id}>
                    <ConversationItem
                      conversation={c}
                      selected={selectedId === c.id}
                      onSelect={() => setSelectedId(c.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-md overflow-hidden flex flex-col h-full min-h-0">
          {selectedId ? (
            <ConversationThread conversationId={selectedId} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground italic">
              {t('messages.selectConversation')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ConversationItem({
  conversation,
  selected,
  onSelect,
}: {
  conversation: ConversationListItemDTO;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-3 border-b border-border hover:bg-muted/50 transition-colors flex items-start gap-3 ${
        selected ? 'bg-primary/10 border-l-2 border-l-primary' : ''
      }`}
    >
      {conversation.partnerAvatarUrl ? (
        <AppImage
          src={conversation.partnerAvatarUrl}
          alt={conversation.partnerName}
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium shrink-0">
          {conversation.partnerName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-foreground truncate">
            {conversation.partnerName}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">
            {timeAgo(conversation.lastMessageAt)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {conversation.lastMessagePreview ?? `— ${t('messages.noMessage')} —`}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <span className="bg-primary text-primary-foreground text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center shrink-0">
          {conversation.unreadCount}
        </span>
      )}
    </button>
  );
}

function ConversationThread({ conversationId }: { conversationId: string }) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, isLoading, error } = useConversationMessages(conversationId);
  const sendMut = useSendMessageMutation(conversationId);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current && data?.messages) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.messages.length]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    sendMut.mutate(text, {
      onSuccess: () => setDraft(''),
      onError: (err) => toast.error(err.message),
    });
  };

  if (isLoading || !data) {
    return <div className="flex-1 flex items-center justify-center">{t('common.loading')}</div>;
  }
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-destructive">
        {(error as Error).message}
      </div>
    );
  }

  const { conversation, messages } = data;
  const myId = user?.id ?? '';

  return (
    <>
      <div className="p-4 border-b border-border flex items-center gap-3">
        {conversation.partner.avatarUrl ? (
          <AppImage
            src={conversation.partner.avatarUrl}
            alt={conversation.partner.fullName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
            {conversation.partner.fullName.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground">{conversation.partner.fullName}</p>
          <p className="text-xs text-muted-foreground">
            {conversation.partner.role === 'teacher' ? t('messages.teacher') : t('messages.student')}
            {conversation.courseTitle && ` · ${conversation.courseTitle}`}
          </p>
        </div>
        {user?.role === 'teacher' && (
          <Link
            href={`/teacher-dashboard/students/${conversation.partner.id}`}
            className="text-xs text-primary hover:underline shrink-0"
          >
            {t('messages.profile')}
          </Link>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground italic text-sm py-8">
            {t('messages.writeFirstMessage')}
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === myId;
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{m.body}</p>
                  <div
                    className={`flex items-center gap-1 mt-1 text-[10px] ${
                      isMine ? 'text-primary-foreground/70 justify-end' : 'text-muted-foreground'
                    }`}
                  >
                    <span>{timeOfDay(m.createdAt)}</span>
                    {isMine && (
                      <Icon
                        name={m.readAt ? 'CheckIcon' : 'ClockIcon'}
                        size={10}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="p-3 border-t border-border flex items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('messages.writeMessage')}
          maxLength={4000}
          className="flex-1 px-4 py-2 bg-muted/30 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sendMut.isPending}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          aria-label={t('common.submit')}
        >
          {sendMut.isPending ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Icon name="PaperAirplaneIcon" size={16} />
          )}
        </button>
      </form>
    </>
  );
}
