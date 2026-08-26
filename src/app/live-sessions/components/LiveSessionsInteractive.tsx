'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ErrorState from '@/components/common/ErrorState';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate } from '@/lib/i18n/format';
import { getSubjectLabel } from '@/lib/data/subject-labels';

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  hostName: string;
  coverImage: string | null;
  startsAt: string;
  durationMin: number;
  isLive: boolean;
  isPast: boolean;
  meetingUrl: string | null;
}

const LiveSessionsInteractive = () => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await fetch('/api/live-sessions', { credentials: 'include' });
      if (res.status === 401) {
        router.push('/login?redirect=/live-sessions');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions(data.sessions || []);
      setSubscribed(Boolean(data.subscribed));
    } catch (err) {
      console.error('Jonli darslar yuklanmadi:', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const upcoming = sessions.filter((s) => !s.isPast);
  const past = sessions.filter((s) => s.isPast);

  const handleJoin = (s: LiveSession) => {
    if (s.meetingUrl) {
      window.open(s.meetingUrl, '_blank', 'noopener,noreferrer');
    } else {
      router.push('/student-subscription');
    }
  };

  const dateLabel = (iso: string) =>
    formatDate(iso, locale, { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const Card = ({ s }: { s: LiveSession }) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-warm hover:shadow-warm-md transition-shadow flex flex-col">
      <div className="relative h-28 bg-gradient-to-br from-primary via-primary/80 to-secondary flex items-center justify-center">
        <Icon name="VideoCameraIcon" size={34} className="text-primary-foreground/70" />
        {s.isLive && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-error text-white text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {t('live.liveNow')}
          </span>
        )}
        {s.subject && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-card/90 text-xs font-medium text-foreground">
            {getSubjectLabel(s.subject)}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <h3 className="font-heading font-semibold text-foreground line-clamp-2">{s.title}</h3>
        {s.description && <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>}
        <div className="mt-auto space-y-1 pt-2 text-sm text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <Icon name="UserIcon" size={14} /> {s.hostName}
          </p>
          <p className="flex items-center gap-1.5">
            <Icon name="CalendarIcon" size={14} /> {dateLabel(s.startsAt)} · {s.durationMin} {t('live.min')}
          </p>
        </div>
        {s.isPast ? (
          <span className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium">
            <Icon name="CheckCircleIcon" size={16} /> {t('live.ended')}
          </span>
        ) : s.meetingUrl ? (
          <button
            onClick={() => handleJoin(s)}
            className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Icon name="VideoCameraIcon" size={16} /> {s.isLive ? t('live.joinNow') : t('live.join')}
          </button>
        ) : (
          <button
            onClick={() => handleJoin(s)}
            className="mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Icon name="LockClosedIcon" size={16} /> {t('live.joinWithSub')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
            <Icon name="VideoCameraIcon" size={26} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">{t('live.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('live.subtitle')}</p>
          </div>
        </div>

        {/* Upsell */}
        {!isLoading && !subscribed && sessions.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Icon name="SparklesIcon" size={22} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{t('live.upsellTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('live.upsellDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/student-subscription')}
              className="flex-shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Icon name="SparklesIcon" size={16} /> {t('live.subscribe')}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-card rounded-xl border border-border animate-pulse" />
            ))}
          </div>
        ) : loadError ? (
          <ErrorState onRetry={load} />
        ) : sessions.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center max-w-xl mx-auto">
            <Icon name="VideoCameraIcon" size={44} className="text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">{t('live.emptyTitle')}</h2>
            <p className="text-muted-foreground">{t('live.emptyDesc')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-lg font-heading font-semibold text-foreground mb-4">{t('live.upcoming')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcoming.map((s) => <Card key={s.id} s={s} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-lg font-heading font-semibold text-foreground mb-4">{t('live.past')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {past.map((s) => <Card key={s.id} s={s} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default LiveSessionsInteractive;
