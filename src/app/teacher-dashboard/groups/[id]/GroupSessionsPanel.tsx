'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';

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

const UZ_MONTHS = ['yan', 'fev', 'mar', 'apr', 'may', 'iyn', 'iyl', 'avg', 'sen', 'okt', 'noy', 'dek'];
// JS getDay(): 0=Yakshanba ... 6=Shanba
const WEEKDAYS: { d: number; label: string }[] = [
  { d: 1, label: 'Du' },
  { d: 2, label: 'Se' },
  { d: 3, label: 'Cho' },
  { d: 4, label: 'Pa' },
  { d: 5, label: 'Ju' },
  { d: 6, label: 'Sha' },
  { d: 0, label: 'Ya' },
];

function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]}, ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
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
    if (title.trim().length < 2) return toast.error('Dars nomini kiriting');
    if (!meetingUrl.trim()) return toast.error('Meet havolasini kiriting');

    let payload: Record<string, unknown>;
    if (mode === 'series') {
      if (occurrences.length === 0) return toast.error('Kamida bitta dars sanasi kerak');
      payload = { mode: 'series', title, occurrences, durationMin, meetingUrl };
    } else {
      if (!singleAt) return toast.error('Dars sanasi/vaqtini tanlang');
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
        toast.error(data.error || 'Dars yaratib bo\'lmadi');
        return;
      }
      toast.success(mode === 'series' ? `${data.count} ta dars rejaga qo'shildi` : 'Dars rejaga qo\'shildi');
      resetForm();
      setShowForm(false);
      await reload();
    } catch {
      toast.error('Tarmoq xatosi');
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
        toast.error(data.error || 'Bekor qilib bo\'lmadi');
        return;
      }
      toast.success(scope === 'series' ? `${data.cancelled} ta dars bekor qilindi` : 'Dars bekor qilindi');
      await reload();
    } catch {
      toast.error('Tarmoq xatosi');
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

  return (
    <section className="bg-card border border-border rounded-xl p-5 shadow-warm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
            <Icon name="VideoCameraIcon" size={18} />
          </span>
          <h2 className="text-lg font-heading font-semibold text-foreground">Jonli darslar</h2>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Icon name={showForm ? "XMarkIcon" : "PlusIcon"} size={16} />
          {showForm ? 'Yopish' : 'Dars qo\'shish'}
        </button>
      </div>

      {/* Meet havolasi haqida qisqa yordam */}
      {showForm && (
        <div className="mb-4 rounded-lg border border-border bg-background/60 p-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Dars nomi</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Masalan: Algebra — 1-mavzu"
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Davomiylik (daqiqa)</span>
              <input
                type="number"
                min={10}
                max={480}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Google Meet havolasi</span>
            <input
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span className="mt-1 block text-[11px] text-muted-foreground">
              Google Calendar'da takroriy hodisa yarating → "Add Google Meet" → havolani shu yerga joylashtiring.
            </span>
          </label>

          {/* Rejim: bir martalik / takroriy */}
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
                {mo === 'single' ? 'Bir martalik' : 'Takroriy'}
              </button>
            ))}
          </div>

          {mode === 'single' ? (
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Sana va vaqt</span>
              <input
                type="datetime-local"
                value={singleAt}
                onChange={(e) => setSingleAt(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Boshlanish sanasi</span>
                  <input
                    type="date"
                    value={seriesDate}
                    onChange={(e) => setSeriesDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Vaqt</span>
                  <input
                    type="time"
                    value={seriesTime}
                    onChange={(e) => setSeriesTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-muted-foreground">Necha hafta</span>
                  <input
                    type="number"
                    min={1}
                    max={52}
                    value={seriesWeeks}
                    onChange={(e) => setSeriesWeeks(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </label>
              </div>
              <div>
                <span className="text-xs font-medium text-muted-foreground">Hafta kunlari</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((w) => (
                    <button
                      key={w.d}
                      type="button"
                      onClick={() => toggleWeekday(w.d)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        weekdays.has(w.d)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground hover:bg-muted/70'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {occurrences.length > 0
                  ? `Jami ${occurrences.length} ta dars yaratiladi (birinchisi: ${fmtWhen(occurrences[0])}).`
                  : 'Sana, vaqt va kamida bitta hafta kunini tanlang.'}
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
              {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </div>
      )}

      {/* Ro'yxat */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Hali jonli dars rejalashtirilmagan.</p>
      ) : (
        <div className="space-y-4">
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Kelayotgan</h3>
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
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">O'tgan / bekor</h3>
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
  const cancelled = s.status === 'cancelled';
  return (
    <li className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
            {cancelled && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                BEKOR
              </span>
            )}
            {s.seriesId && !cancelled && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                SERIYA
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmtWhen(s.startsAt)} · {s.durationMin} daq · {s.attendeeCount} qatnashdi
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onAttendance(s)}
            className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground hover:bg-muted/70"
            title="Davomat"
          >
            <Icon name="UsersIcon" size={14} />
          </button>
          {!cancelled && !past && (
            <>
              <button
                type="button"
                onClick={() => onCancel(s, 'one')}
                className="rounded-lg bg-muted px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10"
                title="Bekor qilish"
              >
                <Icon name="TrashIcon" size={14} />
              </button>
              {s.seriesId && (
                <button
                  type="button"
                  onClick={() => onCancel(s, 'series')}
                  className="rounded-lg bg-muted px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-500/10"
                  title="Butun seriyani bekor qilish"
                >
                  Seriya
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {attendanceOpen && (
        <div className="mt-2 border-t border-border pt-2">
          {attendance.length === 0 ? (
            <p className="text-xs text-muted-foreground">Hali hech kim qo'shilmagan.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {attendance.map((a) => (
                <li
                  key={a.studentId}
                  className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-foreground"
                >
                  {a.fullName || 'Nomaʼlum'}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
