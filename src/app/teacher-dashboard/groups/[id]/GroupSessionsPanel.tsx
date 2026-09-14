'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/i18n/format';
import { LOCALE_TAG } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

interface Session {
  id: string;
  title: string;
  startsAt: string;
  durationMin: number;
  meetingUrl: string;
  status: string;
  seriesId: string | null;
  attendeeCount: number;
}

interface Props {
  groupId: string;
}

// JS getDay(): 0=Yakshanba ... 6=Shanba. Panel tartibi Du..Ya.
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const UZ_WD = ['Ya', 'Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha']; // index = getDay()

function weekdayLabel(d: number, locale: Locale): string {
  if (locale === 'uz') return UZ_WD[d];
  // 2024-01-07 (UTC) — yakshanba; +d bilan kerakli kun.
  const ref = new Date(Date.UTC(2024, 0, 7 + d));
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], { weekday: 'short', timeZone: 'UTC' }).format(ref);
}

function fmtWhen(iso: string, locale: Locale): string {
  return formatDateTime(iso, locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isPast(s: Session): boolean {
  return new Date(s.startsAt).getTime() + s.durationMin * 60 * 1000 < Date.now();
}

/** Seriya sanalarini brauzerda (foydalanuvchi TZ'sida) hisoblab ISO ro'yxat qaytaradi. */
function computeOccurrences(startDate: string, time: string, weekdays: Set<number>, weeks: number): string[] {
  if (!startDate || !time || weekdays.size === 0 || weeks < 1) return [];
  const [h, m] = time.split(':').map(Number);
  const base = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(base.getTime())) return [];
  const out: string[] = [];
  const floor = Date.now() - 60 * 60 * 1000;
  for (let i = 0; i < weeks * 7 && out.length < 60; i++) {
    const day = new Date(base);
    day.setDate(base.getDate() + i);
    if (weekdays.has(day.getDay())) {
      day.setHours(h, m, 0, 0);
      if (day.getTime() >= floor) out.push(day.toISOString());
    }
  }
  return out;
}

export default function GroupSessionsPanel({ groupId }: Props) {
  const { t, locale } = useI18n();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attendanceOf, setAttendanceOf] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<
    { studentId: string; fullName: string | null; joinedAt: string }[]
  >([]);

  // Forma
  const [mode, setMode] = useState<'single' | 'series'>('single');
  const [title, setTitle] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [singleAt, setSingleAt] = useState('');
  const [seriesDate, setSeriesDate] = useState('');
  const [seriesTime, setSeriesTime] = useState('18:00');
  const [seriesWeeks, setSeriesWeeks] = useState(8);
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set([1, 3]));

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/sessions`);
      const data = await res.json().catch(() => ({}));
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const occurrences = useMemo(
    () => computeOccurrences(seriesDate, seriesTime, weekdays, seriesWeeks),
    [seriesDate, seriesTime, weekdays, seriesWeeks],
  );

  function toggleWeekday(d: number) {
    setWeekdays((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function resetForm() {
    setTitle('');
    setMeetingUrl('');
    setDurationMin(60);
    setSingleAt('');
    setSeriesDate('');
    setMode('single');
  }

  async function submit() {
    if (title.trim().length < 2) return toast.error(t('liveSessions.enterName'));
    if (!meetingUrl.trim()) return toast.error(t('liveSessions.enterLink'));

    let payload: Record<string, unknown>;
    if (mode === 'series') {
      if (occurrences.length === 0) return toast.error(t('liveSessions.needDate'));
      payload = { mode: 'series', title, occurrences, durationMin, meetingUrl };
    } else {
      if (!singleAt) return toast.error(t('liveSessions.needDateTime'));
      payload = { mode: 'single', title, startsAt: new Date(singleAt).toISOString(), durationMin, meetingUrl };
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/teacher/groups/${groupId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t('liveSessions.createFailed'));
        return;
      }
      toast.success(
        mode === 'series'
          ? t('liveSessions.seriesCreated', { count: data.count })
          : t('liveSessions.singleCreated'),
      );
      resetForm();
      setShowForm(false);
      await reload();
    } catch {
      toast.error(t('liveSessions.networkError'));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancel(s: Session, scope: 'one' | 'series') {
    const q = scope === 'series' ? '?scope=series' : '';
    try {
      const res = await fetch(`/api/teacher/sessions/${s.id}${q}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || t('liveSessions.cancelFailed'));
        return;
      }
      toast.success(
        scope === 'series'
          ? t('liveSessions.seriesCancelled', { count: data.cancelled })
          : t('liveSessions.sessionCancelled'),
      );
      await reload();
    } catch {
      toast.error(t('liveSessions.networkError'));
    }
  }

  async function openAttendance(s: Session) {
    if (attendanceOf === s.id) {
      setAttendanceOf(null);
      return;
    }
    setAttendanceOf(s.id);
    setAttendance([]);
    try {
      const res = await fetch(`/api/teacher/sessions/${s.id}/attendance`);
      const data = await res.json().catch(() => ({}));
      setAttendance(Array.isArray(data.attendance) ? data.attendance : []);
    } catch {
      /* noop */
    }
  }

  const upcoming = sessions.filter((s) => s.status === 'scheduled' && !isPast(s));
  const past = sessions.filter((s) => s.status !== 'scheduled' || isPast(s));

  const inputCls =
    'mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-warm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            <Icon name="VideoCameraIcon" size={18} />
          </span>
          <h2 className="text-lg font-heading font-semibold text-foreground">{t('liveSessions.title')}</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Icon name={showForm ? 'XMarkIcon' : 'PlusIcon'} size={16} />
          {showForm ? t('liveSessions.closeBtn') : t('liveSessions.addBtn')}
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border border-border bg-background/60 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">{t('liveSessions.lessonName')}</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('liveSessions.lessonNamePlaceholder')}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">{t('liveSessions.duration')}</span>
              <input
                type="number"
                min={10}
                max={480}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className={inputCls}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">{t('liveSessions.meetLink')}</span>
            <input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className={inputCls}
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">{t('liveSessions.meetHelp')}</span>
          </label>

          <div className="flex gap-2">
            {(['single', 'series'] as const).map((mo) => (
              <button
                key={mo}
                type="button"
                onClick={() => setMode(mo)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  mode === mo ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/70'
                }`}
              >
                {mo === 'single' ? t('liveSessions.modeSingle') : t('liveSessions.modeSeries')}
              </button>
            ))}
          </div>

          {mode === 'single' ? (
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">{t('liveSessions.dateTime')}</span>
              <input
                type="datetime-local"
                value={singleAt}
                onChange={(e) => setSingleAt(e.target.value)}
                className={inputCls}
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">{t('liveSessions.startDate')}</span>
                  <input
                    type="date"
                    value={seriesDate}
                    onChange={(e) => setSeriesDate(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">{t('liveSessions.time')}</span>
                  <input
                    type="time"
                    value={seriesTime}
                    onChange={(e) => setSeriesTime(e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">{t('liveSessions.weeks')}</span>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={seriesWeeks}
                    onChange={(e) => setSeriesWeeks(Number(e.target.value))}
                    className={inputCls}
                  />
                </label>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('liveSessions.weekdaysLabel')}</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {WEEKDAY_ORDER.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleWeekday(d)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        weekdays.has(d)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground hover:bg-muted/70'
                      }`}
                    >
                      {weekdayLabel(d, locale)}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {occurrences.length > 0
                  ? t('liveSessions.occurrencesPreview', {
                      count: occurrences.length,
                      first: fmtWhen(occurrences[0], locale),
                    })
                  : t('liveSessions.occurrencesHint')}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? t('liveSessions.saving') : t('liveSessions.save')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">{t('liveSessions.loading')}</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('liveSessions.empty')}</p>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t('liveSessions.upcoming')}
              </h3>
              <ul className="space-y-2">
                {upcoming.map((s) => (
                  <SessionRow
                    key={s.id}
                    s={s}
                    onCancel={cancel}
                    onAttendance={openAttendance}
                    attendanceOpen={attendanceOf === s.id}
                    attendance={attendance}
                  />
                ))}
              </ul>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {t('liveSessions.pastCancelled')}
              </h3>
              <ul className="space-y-2 opacity-70">
                {past.slice(0, 10).map((s) => (
                  <SessionRow
                    key={s.id}
                    s={s}
                    onCancel={cancel}
                    onAttendance={openAttendance}
                    attendanceOpen={attendanceOf === s.id}
                    attendance={attendance}
                    past
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function SessionRow({
  s,
  onCancel,
  onAttendance,
  attendanceOpen,
  attendance,
  past,
}: {
  s: Session;
  onCancel: (s: Session, scope: 'one' | 'series') => void;
  onAttendance: (s: Session) => void;
  attendanceOpen: boolean;
  attendance: { studentId: string; fullName: string | null; joinedAt: string }[];
  past?: boolean;
}) {
  const { t, locale } = useI18n();
  const cancelled = s.status === 'cancelled';
  return (
    <li className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
            {cancelled && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                {t('liveSessions.badgeCancelled')}
              </span>
            )}
            {s.seriesId && !cancelled && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                {t('liveSessions.badgeSeries')}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtWhen(s.startsAt, locale)} · {t('liveSessions.rowMeta', { duration: s.durationMin, count: s.attendeeCount })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onAttendance(s)}
            className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/70"
            title={t('liveSessions.attendanceTitle')}
          >
            <Icon name="UsersIcon" size={14} />
          </button>
          {!cancelled && !past && (
            <>
              <button
                type="button"
                onClick={() => onCancel(s, 'one')}
                className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10"
                title={t('liveSessions.cancelTitle')}
              >
                <Icon name="TrashIcon" size={14} />
              </button>
              {s.seriesId && (
                <button
                  type="button"
                  onClick={() => onCancel(s, 'series')}
                  className="rounded-lg bg-muted px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-500/10"
                  title={t('liveSessions.cancelSeriesTitle')}
                >
                  {t('liveSessions.cancelSeriesBtn')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {attendanceOpen && (
        <div className="mt-2 border-t border-border pt-2">
          {attendance.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('liveSessions.noAttendance')}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {attendance.map((a) => (
                <li key={a.studentId} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground">
                  {a.fullName || t('liveSessions.unknownName')}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
