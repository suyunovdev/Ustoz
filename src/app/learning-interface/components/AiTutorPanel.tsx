'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface AiTutorPanelProps {
  topicTitle: string;
  topicContent: string;
  courseTitle: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type Mode = 'ask' | 'explain' | 'practice' | 'hint';

const AiTutorPanel = ({ topicTitle, topicContent, courseTitle }: AiTutorPanelProps) => {
  const { t } = useI18n();
  const router = useRouter();

  const [subActive, setSubActive] = useState<boolean | null>(null); // null = tekshirilyapti
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Obuna holatini tekshirish
  useEffect(() => {
    let cancelled = false;
    fetch('/api/subscriptions/my', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { subscription: null }))
      .then((d) => {
        if (!cancelled) setSubActive(Boolean(d?.subscription));
      })
      .catch(() => {
        if (!cancelled) setSubActive(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const send = async (mode: Mode, questionOverride?: string) => {
    if (isSending) return;
    const question = (questionOverride ?? input).trim();
    if (mode === 'ask' && question.length < 2) return;

    setError(null);
    const userMsg: ChatMessage | null =
      mode === 'ask'
        ? { role: 'user', content: question }
        : {
            role: 'user',
            content:
              mode === 'explain'
                ? t('aiTutor.explain')
                : mode === 'practice'
                  ? t('aiTutor.practice')
                  : t('aiTutor.hint'),
          };

    const history = messages.slice(-6);
    if (userMsg) setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/learning/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          question: mode === 'ask' ? question : '',
          mode,
          topicTitle,
          topicContent,
          courseTitle,
          history,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data.code === 'SUBSCRIPTION_REQUIRED') {
        setSubActive(false);
        return;
      }
      if (res.status === 429) {
        setError(t('aiTutor.limitReached'));
        setRemaining(0);
        return;
      }
      if (res.status === 503) {
        setError(t('aiTutor.notConfigured'));
        return;
      }
      if (!res.ok || !data.answer) {
        setError(t('aiTutor.errorGeneric'));
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
      if (typeof data.remaining === 'number') setRemaining(data.remaining);
    } catch {
      setError(t('aiTutor.errorGeneric'));
    } finally {
      setIsSending(false);
    }
  };

  // ── Yuklanmoqda ──────────────────────────────────────────────
  if (subActive === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Obuna yo'q → upsell ──────────────────────────────────────
  if (!subActive) {
    return (
      <div className="text-center py-8 px-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
          <Icon name="SparklesIcon" size={30} variant="solid" className="text-primary-foreground" />
        </div>
        <h3 className="text-lg font-heading font-bold text-foreground mb-2">{t('aiTutor.upsellTitle')}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">{t('aiTutor.upsellDesc')}</p>
        <ul className="text-sm text-foreground max-w-xs mx-auto mb-6 space-y-2 text-left">
          {[t('aiTutor.perkExplain'), t('aiTutor.perkPractice'), t('aiTutor.perkHint')].map((p) => (
            <li key={p} className="flex items-start gap-2">
              <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => router.push('/student-subscription')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-warm"
        >
          <Icon name="SparklesIcon" size={18} />
          {t('aiTutor.upsellCta')}
        </button>
      </div>
    );
  }

  // ── Obunachi → chat ──────────────────────────────────────────
  return (
    <div className="flex flex-col h-[28rem]">
      {/* Xabarlar */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Icon name="SparklesIcon" size={24} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t('aiTutor.emptyHint')}</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-error text-center py-2">{error}</p>
      )}

      {/* Tez amallar */}
      <div className="flex items-center gap-2 flex-wrap pt-3">
        {([
          { mode: 'explain' as Mode, label: t('aiTutor.explain'), icon: 'LightBulbIcon' },
          { mode: 'practice' as Mode, label: t('aiTutor.practice'), icon: 'PencilSquareIcon' },
          { mode: 'hint' as Mode, label: t('aiTutor.hint'), icon: 'QuestionMarkCircleIcon' },
        ]).map((a) => (
          <button
            key={a.mode}
            onClick={() => send(a.mode)}
            disabled={isSending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors disabled:opacity-50"
          >
            <Icon name={a.icon} size={14} className="text-primary" />
            {a.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send('ask');
        }}
        className="flex items-end gap-2 pt-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send('ask');
            }
          }}
          rows={1}
          placeholder={t('aiTutor.placeholder')}
          className="flex-1 resize-none max-h-28 px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          type="submit"
          disabled={isSending || input.trim().length < 2}
          aria-label={t('aiTutor.send')}
          className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Icon name="PaperAirplaneIcon" size={18} />
        </button>
      </form>

      {/* Footer: limit + disclaimer */}
      <div className="flex items-center justify-between pt-2 text-[11px] text-muted-foreground">
        <span>{t('aiTutor.disclaimer')}</span>
        {remaining !== null && (
          <span className="font-data tabular-nums flex-shrink-0">{t('aiTutor.remaining', { n: remaining })}</span>
        )}
      </div>
    </div>
  );
};

export default AiTutorPanel;
