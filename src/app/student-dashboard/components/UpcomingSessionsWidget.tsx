'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';

interface StudentSession {
  id: string;
  title: string;
  startsAt: string;
  durationMin: number;
  status: string;
  group: { id: string; name: string; color: string };
}

const DOT_CLASS: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  purple: 'bg-violet-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
};

const UZ_MONTHS = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const mon = UZ_MONTHS[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day}-${mon}, ${hh}:${mm}`;
}

/** Dars hozir jonlimi? (boshlanishiga 15 daq — tugagach 30 daq oynada) */
function isLiveNow(s: StudentSession): boolean {
  const start = new Date(s.startsAt).getTime();
  const end = start + s.durationMin * 60 * 1000;
  const now = Date.now();
  return now >= start - 15 * 60 * 1000 && now <= end + 30 * 60 * 1000;
}

export default function UpcomingSessionsWidget() {
  const [sessions, setSessions] = useState<StudentSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    let alive = true;
    fetch('/api/student/sessions')
      .then((r) => (r.ok ? r.json() : { sessions: [] }))
      .then((data) => {
        if (alive) setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Har 60 soniyada "jonli" holatini qayta hisoblash uchun.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  async function join(session: StudentSession) {
    setJoiningId(session.id);
    try {
      const res = await fetch(`/api/student/sessions/${session.id}/join`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.meetingUrl) {
        toast.error(data.error || "Darsga qo'shilib bo'lmadi");
        return;
      }
      window.open(data.meetingUrl, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Tarmoq xatosi — qayta urinib ko\'ring');
    } finally {
      setJoiningId(null);
    }
  }

  if (loading || sessions.length === 0) return null;

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-warm">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
          <Icon name="VideoCameraIcon" size={18} />
        </span>
        <h2 className="text-base font-heading font-semibold text-foreground">Yaqin jonli darslar</h2>
      </div>

      <ul className="space-y-3">
        {sessions.slice(0, 5).map((s) => {
          const live = isLiveNow(s);
          return (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${DOT_CLASS[s.group.color] ?? DOT_CLASS.blue}`} />
                  <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                  {live && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      JONLI
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {s.group.name} · {formatWhen(s.startsAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => join(s)}
                disabled={joiningId === s.id}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                  live
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-foreground hover:bg-muted/70'
                }`}
              >
                <Icon name="VideoCameraIcon" size={14} />
                {joiningId === s.id ? '...' : "Qo'shilish"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
