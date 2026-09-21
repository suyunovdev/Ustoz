'use client';

/**
 * SubscriptionsPanel — obuna rejalari, faol obunalar va so'rovlar (CRM Tabs + jadval).
 */
import { useEffect, useState, useCallback } from 'react';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Menu } from '@/components/ui/Menu';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import NumberInput from '@/components/ui/NumberInput';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';
import { formatCurrency, formatDate } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

interface Plan {
  id: string; name: string; description: string; priceUzs: string; durationDays: number;
  tier: string; features: string[]; allCoursesAccess: boolean; isActive: boolean; sortOrder: number;
}
interface ActiveSub {
  id: string; userName: string; userEmail: string; planName: string; status: string; startedAt: string; expiresAt: string;
}
interface ReqRow {
  id: string; userName: string; userEmail: string; planName: string; durationDays: number; paymentMethod: string | null; status: string; createdAt: string;
}
interface PlanForm {
  name: string; description: string; priceUzs: string; durationDays: string; tier: string;
  features: string; allCoursesAccess: boolean; isActive: boolean; sortOrder: string;
}

const EMPTY_FORM: PlanForm = {
  name: '', description: '', priceUzs: '', durationDays: '30', tier: 'basic',
  features: '', allCoursesAccess: false, isActive: true, sortOrder: '0',
};

const input =
  'w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring';

function fmtDate(iso: string, locale: Locale) {
  return formatDate(iso, locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SubscriptionsPanel() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<'plans' | 'active' | 'requests'>('plans');

  const [requests, setRequests] = useState<ReqRow[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [subs, setSubs] = useState<ActiveSub[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);

  const [grantOpen, setGrantOpen] = useState(false);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlanId, setGrantPlanId] = useState('');
  const [grantPlans, setGrantPlans] = useState<Plan[]>([]);
  const [granting, setGranting] = useState(false);

  const [discountInput, setDiscountInput] = useState('');
  const [discountSaved, setDiscountSaved] = useState<number | null>(null);
  const [savingDiscount, setSavingDiscount] = useState(false);

  useEffect(() => {
    fetch('/api/admin/subscription-discount', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.discountPct === 'number') {
          setDiscountSaved(d.discountPct);
          setDiscountInput(String(d.discountPct));
        }
      })
      .catch(() => {});
  }, []);

  const saveDiscount = async () => {
    const val = Number(discountInput);
    if (!Number.isFinite(val) || val < 0 || val > 100) return toast.error('0–100 orasida foiz kiriting');
    setSavingDiscount(true);
    try {
      const res = await fetch('/api/admin/subscription-discount', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ discountPct: val }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setDiscountSaved(d.discountPct); toast.success('Chegirma saqlandi'); }
      else toast.error(d.error || 'Xatolik');
    } finally { setSavingDiscount(false); }
  };

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await fetch('/api/admin/subscription-plans', { credentials: 'include' });
      if (!res.ok) throw new Error();
      setPlans((await res.json()).plans || []);
    } catch { toast.error(t('admin.subError')); } finally { setPlansLoading(false); }
  }, [t]);

  const loadSubs = useCallback(async () => {
    setSubsLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions?status=active', { credentials: 'include' });
      if (!res.ok) throw new Error();
      setSubs((await res.json()).subscriptions || []);
    } catch { toast.error(t('admin.subError')); } finally { setSubsLoading(false); }
  }, [t]);

  const loadRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await fetch('/api/admin/subscription-requests?status=pending', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const list: ReqRow[] = (await res.json()).requests || [];
      setRequests(list);
      setPendingCount(list.length);
    } catch { toast.error(t('admin.subError')); } finally { setRequestsLoading(false); }
  }, [t]);

  useEffect(() => {
    fetch('/api/admin/subscription-requests?status=pending', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.requests) setPendingCount(d.requests.length); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'plans') loadPlans();
    else if (tab === 'active') loadSubs();
    else loadRequests();
  }, [tab, loadPlans, loadSubs, loadRequests]);

  const reviewRequest = async (id: string, action: 'approve' | 'reject') => {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/admin/subscription-requests/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(action === 'approve' ? 'Obuna tasdiqlandi va faollashtirildi' : "So'rov rad etildi");
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setPendingCount((c) => Math.max(0, c - 1));
      } else {
        toast.error((await res.json().catch(() => ({}))).error || 'Xatolik');
      }
    } finally { setReviewingId(null); }
  };

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (p: Plan) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description ?? '', priceUzs: String(p.priceUzs ?? ''),
      durationDays: String(p.durationDays ?? ''), tier: p.tier ?? '', features: (p.features ?? []).join(', '),
      allCoursesAccess: !!p.allCoursesAccess, isActive: !!p.isActive, sortOrder: String(p.sortOrder ?? 0),
    });
    setModalOpen(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) return toast.error(t('admin.subError'));
    setSaving(true);
    const payload = {
      name: form.name.trim(), description: form.description.trim(), priceUzs: Number(form.priceUzs) || 0,
      durationDays: Number(form.durationDays) || 0, tier: form.tier.trim(),
      features: form.features.split(',').map((f) => f.trim()).filter(Boolean),
      allCoursesAccess: form.allCoursesAccess, isActive: form.isActive, sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      const res = await fetch(
        editingId ? `/api/admin/subscription-plans/${editingId}` : '/api/admin/subscription-plans',
        { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(payload) },
      );
      if (!res.ok) throw new Error();
      toast.success(editingId ? t('admin.subUpdated') : t('admin.subCreated'));
      setModalOpen(false);
      await loadPlans();
    } catch { toast.error(t('admin.subError')); } finally { setSaving(false); }
  };

  const togglePlanActive = async (p: Plan) => {
    try {
      const res = await fetch(`/api/admin/subscription-plans/${p.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (res.ok) { setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x))); toast.success(t('admin.subUpdated')); }
      else toast.error('Xatolik');
    } catch { toast.error('Xatolik'); }
  };

  const openGrant = async () => {
    setGrantEmail(''); setGrantPlanId(''); setGrantOpen(true);
    try {
      const res = await fetch('/api/admin/subscription-plans', { credentials: 'include' });
      if (res.ok) {
        const ps: Plan[] = ((await res.json()).plans || []).filter((p: Plan) => p.isActive);
        setGrantPlans(ps);
        if (ps[0]) setGrantPlanId(ps[0].id);
      }
    } catch { /* ignore */ }
  };

  const submitGrant = async () => {
    if (!grantEmail.trim()) return toast.error('Foydalanuvchi emailini kiriting');
    if (!grantPlanId) return toast.error('Obuna rejasini tanlang');
    setGranting(true);
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ email: grantEmail.trim(), planId: grantPlanId }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { toast.success("Obuna qo'lda berildi"); setGrantOpen(false); await loadSubs(); }
      else toast.error(d.error || 'Xatolik');
    } finally { setGranting(false); }
  };

  const cancelSub = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/subscriptions/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) { toast.success('Obuna bekor qilindi'); setSubs((prev) => prev.filter((s) => s.id !== id)); }
      else toast.error((await res.json().catch(() => ({}))).error || 'Xatolik');
    } catch { toast.error('Xatolik'); }
  };

  // ─── Column definitions ──────────────────────────────────────────────────
  const planCols: Column<Plan>[] = [
    {
      key: 'name', header: 'Reja',
      render: (p) => (
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate">{p.name}</div>
          {p.description && <div className="text-xs text-muted-foreground truncate">{p.description}</div>}
        </div>
      ),
    },
    { key: 'priceUzs', header: t('admin.colPrice'), align: 'right', cellClassName: 'whitespace-nowrap font-medium', render: (p) => formatCurrency(Number(p.priceUzs), locale, 'UZS') },
    { key: 'durationDays', header: 'Muddat', align: 'right', headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap', render: (p) => `${p.durationDays} kun` },
    { key: 'tier', header: 'Tier', headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell', render: (p) => <Badge variant="secondary">{p.tier}</Badge> },
    { key: 'access', header: 'Kirish', headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell', render: (p) => (p.allCoursesAccess ? <Badge variant="primary">Barcha kurslar</Badge> : <span className="text-muted-foreground">—</span>) },
    { key: 'isActive', header: t('admin.colStatus'), render: (p) => (p.isActive ? <Badge variant="success">Faol</Badge> : <Badge variant="muted">Nofaol</Badge>) },
    {
      key: 'actions', header: '', align: 'right', width: 'w-12',
      render: (p) => (
        <Menu sections={[{ items: [
          { label: 'Tahrirlash', icon: 'PencilSquareIcon', onClick: () => openEdit(p) },
          { label: p.isActive ? 'Nofaol qilish' : 'Faollashtirish', icon: p.isActive ? 'NoSymbolIcon' : 'CheckCircleIcon', onClick: () => togglePlanActive(p) },
        ] }]} />
      ),
    },
  ];

  const subCols: Column<ActiveSub>[] = [
    { key: 'user', header: t('admin.colUser'), render: (s) => (
      <div className="min-w-0"><div className="font-medium text-foreground truncate">{s.userName}</div><div className="text-xs text-muted-foreground truncate">{s.userEmail}</div></div>
    ) },
    { key: 'planName', header: 'Reja', render: (s) => <Badge variant="primary">{s.planName}</Badge> },
    { key: 'startedAt', header: 'Boshlangan', headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap', render: (s) => fmtDate(s.startedAt, locale) },
    { key: 'expiresAt', header: 'Tugaydi', cellClassName: 'text-muted-foreground whitespace-nowrap', render: (s) => fmtDate(s.expiresAt, locale) },
    { key: 'actions', header: '', align: 'right', width: 'w-12', render: (s) => (
      <Menu sections={[{ items: [{ label: 'Bekor qilish', icon: 'XCircleIcon', variant: 'danger', onClick: () => cancelSub(s.id) }] }]} />
    ) },
  ];

  const reqCols: Column<ReqRow>[] = [
    { key: 'user', header: t('admin.colUser'), render: (r) => (
      <div className="min-w-0"><div className="font-medium text-foreground truncate">{r.userName}</div><div className="text-xs text-muted-foreground truncate">{r.userEmail}</div></div>
    ) },
    { key: 'planName', header: 'Reja', render: (r) => <Badge variant="primary">{r.planName}</Badge> },
    { key: 'durationDays', header: 'Muddat', align: 'right', headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap', render: (r) => `${r.durationDays} kun` },
    { key: 'paymentMethod', header: t('admin.colMethod'), headerClassName: 'hidden lg:table-cell', cellClassName: 'hidden lg:table-cell text-muted-foreground', render: (r) => r.paymentMethod ?? '—' },
    { key: 'createdAt', header: t('admin.colDate'), headerClassName: 'hidden md:table-cell', cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap', render: (r) => fmtDate(r.createdAt, locale) },
    { key: 'actions', header: t('admin.colActions'), align: 'right', render: (r) => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="secondary" size="sm" iconLeft="CheckIcon" loading={reviewingId === r.id} onClick={() => reviewRequest(r.id, 'approve')}>Tasdiq</Button>
        <Button variant="outline" size="sm" className="text-destructive" iconLeft="XMarkIcon" disabled={reviewingId === r.id} onClick={() => reviewRequest(r.id, 'reject')}>Rad</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-4">
      {/* Obunachi kurs chegirmasi */}
      <div className="bg-card rounded-lg border border-border p-4 flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Obunachi kurs chegirmasi</p>
          <p className="text-xs text-muted-foreground">Faol obunachilar barcha pullik kurslarga shu foizda chegirma oladi.{discountSaved != null ? ` Hozirgi: ${discountSaved}%` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <NumberInput min={0} max={100} value={Number(discountInput) || 0} onValueChange={(n) => setDiscountInput(String(n))} className={`${input} w-24`} />
          <Button variant="primary" size="sm" loading={savingDiscount} onClick={saveDiscount}>Saqlash</Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Tabs
          items={[
            { id: 'plans', label: 'Rejalar' },
            { id: 'active', label: 'Faol obunalar' },
            { id: 'requests', label: "So'rovlar", count: pendingCount },
          ]}
          value={tab}
          onChange={setTab}
          className="flex-1"
        />
        {tab === 'plans' && <Button variant="primary" size="sm" iconLeft="PlusIcon" onClick={openCreate}>Yangi reja</Button>}
        {tab === 'active' && <Button variant="primary" size="sm" iconLeft="PlusIcon" onClick={openGrant}>Qo&apos;lda obuna</Button>}
      </div>

      {tab === 'plans' && (
        <DataTable columns={planCols} rows={plans} getRowId={(p) => p.id} isLoading={plansLoading} emptyIcon="SparklesIcon" emptyTitle="Reja yo'q" />
      )}
      {tab === 'active' && (
        <DataTable columns={subCols} rows={subs} getRowId={(s) => s.id} isLoading={subsLoading} emptyIcon="SparklesIcon" emptyTitle="Faol obuna yo'q" />
      )}
      {tab === 'requests' && (
        <DataTable columns={reqCols} rows={requests} getRowId={(r) => r.id} isLoading={requestsLoading} emptyIcon="InboxIcon" emptyTitle="So'rov yo'q" />
      )}

      {/* Plan create/edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Rejani tahrirlash' : 'Yangi reja'}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Bekor</Button>
            <Button variant="primary" loading={saving} onClick={submitForm}>{editingId ? 'Saqlash' : 'Yaratish'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Nomi *"><input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Tavsif"><textarea className={input} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Narx (UZS)"><input className={input} inputMode="numeric" value={form.priceUzs} onChange={(e) => setForm({ ...form, priceUzs: e.target.value })} /></Field>
            <Field label="Muddat (kun)"><input className={input} inputMode="numeric" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} /></Field>
            <Field label="Tier"><input className={input} value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} /></Field>
            <Field label="Tartib (sortOrder)"><input className={input} inputMode="numeric" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field>
          </div>
          <Field label="Imkoniyatlar (vergul bilan)"><input className={input} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} /></Field>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" className="w-4 h-4 accent-primary" checked={form.allCoursesAccess} onChange={(e) => setForm({ ...form, allCoursesAccess: e.target.checked })} />Barcha kurslar</label>
            <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" className="w-4 h-4 accent-primary" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />Faol</label>
          </div>
        </div>
      </Modal>

      {/* Grant modal */}
      <Modal
        open={grantOpen}
        onClose={() => setGrantOpen(false)}
        title="Qo'lda obuna berish"
        footer={
          <>
            <Button variant="ghost" onClick={() => setGrantOpen(false)}>Bekor</Button>
            <Button variant="primary" loading={granting} onClick={submitGrant}>Berish</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Foydalanuvchi emaili"><input className={input} type="email" value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} placeholder="user@example.com" /></Field>
          <Field label="Obuna rejasi">
            <select className={input} value={grantPlanId} onChange={(e) => setGrantPlanId(e.target.value)}>
              {grantPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
