'use client';

import { useState, useEffect, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import NumberInput from '@/components/ui/NumberInput';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Menu } from '@/components/ui/Menu';
import { Toolbar } from '@/components/ui/Toolbar';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime } from '@/lib/i18n/format';

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
  const { locale } = useI18n();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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

  const handleCreate = async () => {
    if (saving) return;
    if (!form.title.trim() || !form.startsAt || !form.meetingUrl.trim()) {
      toast.error('Sarlavha, vaqt va havola majburiy');
      return;
    }
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
        setCreateOpen(false);
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
    setDeleteId(null);
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

  const input =
    'w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

  const columns: Column<LiveSession>[] = [
    {
      key: 'title',
      header: 'Dars',
      render: (s) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">{s.title}</span>
            {!s.isPublished && <Badge variant="muted">Yashirin</Badge>}
          </div>
          <span className="text-xs text-muted-foreground truncate block">{s.subject || '—'}</span>
        </div>
      ),
    },
    {
      key: 'startsAt',
      header: 'Boshlanish',
      cellClassName: 'text-muted-foreground whitespace-nowrap',
      render: (s) => formatDateTime(s.startsAt, locale),
    },
    {
      key: 'durationMin',
      header: 'Davomiylik',
      align: 'right',
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap',
      render: (s) => `${s.durationMin} daq`,
    },
    {
      key: 'hostName',
      header: 'Host',
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground',
      render: (s) => <span className="truncate">{s.hostName || '—'}</span>,
    },
    {
      key: 'link',
      header: 'Havola',
      render: (s) => (
        <a
          href={s.meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-primary hover:underline"
        >
          <Icon name="VideoCameraIcon" size={16} />
        </a>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: 'w-12',
      render: (s) => (
        <Menu
          sections={[
            {
              items: [
                {
                  label: s.isPublished ? 'Yashirish' : 'Nashr qilish',
                  icon: s.isPublished ? 'EyeSlashIcon' : 'EyeIcon',
                  onClick: () => togglePublish(s),
                },
                { label: "O'chirish", icon: 'TrashIcon', variant: 'danger', onClick: () => setDeleteId(s.id) },
              ],
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar>
        <span className="text-sm text-muted-foreground">{sessions.length} ta jonli dars</span>
        <Button variant="primary" iconLeft="PlusIcon" onClick={() => setCreateOpen(true)}>
          Yangi jonli dars
        </Button>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={sessions}
        getRowId={(s) => s.id}
        isLoading={loading}
        emptyIcon="VideoCameraIcon"
        emptyTitle="Hozircha jonli dars yo'q"
      />

      {/* Yaratish drawer */}
      <Drawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Yangi jonli dars"
        width="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Bekor</Button>
            <Button variant="primary" loading={saving} onClick={handleCreate}>Yaratish</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Sarlavha *">
            <input className={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Tavsif">
            <textarea className={input} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <Field label="Fan">
            <input className={input} placeholder="masalan mathematics" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </Field>
          <Field label="Host nomi">
            <input className={input} value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} />
          </Field>
          <Field label="Boshlanish vaqti *">
            <input type="datetime-local" className={input} value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </Field>
          <Field label="Davomiyligi (daqiqa)">
            <NumberInput min={5} max={600} className={input} value={form.durationMin} onValueChange={(n) => setForm({ ...form, durationMin: n })} />
          </Field>
          <Field label="Meeting havolasi *">
            <input type="url" className={input} placeholder="https://..." value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" className="w-4 h-4 accent-primary" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            Nashr qilingan
          </label>
        </div>
      </Drawer>

      <ConfirmModal
        open={deleteId !== null}
        title="Jonli darsni o'chirish"
        message="Bu jonli dars o'chiriladi. Davom etilsinmi?"
        confirmLabel="O'chirish"
        variant="danger"
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

export default LiveSessionsAdminPanel;
