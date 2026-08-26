'use client';

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';

interface LiveSession {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  hostName: string;
  startsAt: string;
  durationMin: number;
  meetingUrl: string;
  isPublished: boolean;
}

const EMPTY = {
  title: '',
  description: '',
  subject: '',
  hostName: '',
  startsAt: '',
  durationMin: 60,
  meetingUrl: '',
  isPublished: true,
};

const LiveSessionsAdminPanel = () => {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/live-sessions', { credentials: 'include' });
      if (res.ok) {
        const d = await res.json();
        setSessions(d.sessions || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/live-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          durationMin: Number(form.durationMin),
          startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : '',
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success('Jonli dars yaratildi');
        setForm({ ...EMPTY });
        load();
      } else {
        toast.error(d.error || 'Xatolik');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/live-sessions/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      toast.success("O'chirildi");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } else {
      toast.error('Xatolik');
    }
  };

  const togglePublish = async (s: LiveSession) => {
    const res = await fetch(`/api/admin/live-sessions/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isPublished: !s.isPublished }),
    });
    if (res.ok) {
      setSessions((prev) => prev.map((x) => (x.id === s.id ? { ...x, isPublished: !x.isPublished } : x)));
    }
  };

  const input = 'w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Yaratish formasi */}
      <form onSubmit={handleCreate} className="lg:col-span-1 bg-card rounded-xl border border-border p-5 space-y-3 h-fit">
        <h3 className="font-heading font-semibold text-foreground">Yangi jonli dars</h3>
        <input className={input} placeholder="Sarlavha *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className={input} placeholder="Tavsif" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className={input} placeholder="Fan (masalan mathematics)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <input className={input} placeholder="Muallif/host nomi" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} />
        <label className="block text-xs text-muted-foreground">Boshlanish vaqti *</label>
        <input type="datetime-local" className={input} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} required />
        <input type="number" min={5} max={600} className={input} placeholder="Davomiyligi (daqiqa)" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} />
        <input type="url" className={input} placeholder="Meeting havolasi (https://...) *" value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} required />
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Nashr qilingan
        </label>
        <button type="submit" disabled={saving} className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {saving ? 'Saqlanmoqda…' : 'Yaratish'}
        </button>
      </form>

      {/* Ro'yxat */}
      <div className="lg:col-span-2 space-y-3">
        {loading ? (
          <div className="text-sm text-muted-foreground py-8 text-center">Yuklanmoqda…</div>
        ) : sessions.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">Hozircha jonli dars yo&apos;q</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="bg-card rounded-xl border border-border p-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground truncate">{s.title}</p>
                  {!s.isPublished && <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Yashirin</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(s.startsAt).toLocaleString('uz')} · {s.durationMin} daq · {s.hostName}
                </p>
                <a href={s.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">{s.meetingUrl}</a>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => togglePublish(s)} title={s.isPublished ? 'Yashirish' : 'Nashr qilish'} className="p-2 rounded-md hover:bg-muted text-muted-foreground">
                  <Icon name={s.isPublished ? 'EyeIcon' : 'EyeSlashIcon'} size={16} />
                </button>
                <button onClick={() => handleDelete(s.id)} title="O'chirish" className="p-2 rounded-md hover:bg-error/10 text-error">
                  <Icon name="TrashIcon" size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveSessionsAdminPanel;
