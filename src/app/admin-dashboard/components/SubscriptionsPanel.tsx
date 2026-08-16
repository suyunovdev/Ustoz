'use client';

/**
 * SubscriptionsPanel — admin uchun obuna rejalari va faol obunalar boshqaruvi.
 * GET   /api/admin/subscription-plans
 * POST  /api/admin/subscription-plans
 * PATCH /api/admin/subscription-plans/[id]
 * GET   /api/admin/subscriptions?status=active
 */
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';
import { formatCurrency, formatDate } from '@/lib/i18n/format';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceUzs: string;
  durationDays: number;
  tier: string;
  features: string[];
  allCoursesAccess: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface ActiveSub {
  id: string;
  userName: string;
  userEmail: string;
  planName: string;
  status: string;
  startedAt: string;
  expiresAt: string;
}

interface PlanForm {
  name: string;
  description: string;
  priceUzs: string;
  durationDays: string;
  tier: string;
  features: string;
  allCoursesAccess: boolean;
  isActive: boolean;
  sortOrder: string;
}

const EMPTY_FORM: PlanForm = {
  name: '',
  description: '',
  priceUzs: '',
  durationDays: '30',
  tier: 'basic',
  features: '',
  allCoursesAccess: false,
  isActive: true,
  sortOrder: '0',
};

export default function SubscriptionsPanel() {
  const { t, locale } = useI18n();
  const [tab, setTab] = useState<'plans' | 'active'>('plans');

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Active subs state
  const [subs, setSubs] = useState<ActiveSub[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await fetch('/api/admin/subscription-plans', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPlans(data.plans || []);
    } catch {
      toast.error(t('admin.subError'));
    } finally {
      setPlansLoading(false);
    }
  }, [t]);

  const loadSubs = useCallback(async () => {
    setSubsLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions?status=active', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSubs(data.subscriptions || []);
    } catch {
      toast.error(t('admin.subError'));
    } finally {
      setSubsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (tab === 'plans') loadPlans();
    else loadSubs();
  }, [tab, loadPlans, loadSubs]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? '',
      priceUzs: String(p.priceUzs ?? ''),
      durationDays: String(p.durationDays ?? ''),
      tier: p.tier ?? '',
      features: (p.features ?? []).join(', '),
      allCoursesAccess: !!p.allCoursesAccess,
      isActive: !!p.isActive,
      sortOrder: String(p.sortOrder ?? 0),
    });
    setModalOpen(true);
  };

  const submitForm = async () => {
    if (!form.name.trim()) {
      toast.error(t('admin.subError'));
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      priceUzs: Number(form.priceUzs) || 0,
      durationDays: Number(form.durationDays) || 0,
      tier: form.tier.trim(),
      features: form.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean),
      allCoursesAccess: form.allCoursesAccess,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      const res = await fetch(
        editingId ? `/api/admin/subscription-plans/${editingId}` : '/api/admin/subscription-plans',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error();
      toast.success(editingId ? t('admin.subUpdated') : t('admin.subCreated'));
      setModalOpen(false);
      await loadPlans();
    } catch {
      toast.error(t('admin.subError'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Plan) => {
    setBusyId(p.id);
    try {
      const res = await fetch(`/api/admin/subscription-plans/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('admin.subUpdated'));
      setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: !x.isActive } : x)));
    } catch {
      toast.error(t('admin.subError'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="inline-flex rounded-md border border-border bg-card p-1">
          {(['plans', 'active'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-4 py-2 rounded text-sm font-medium transition-smooth ${tab === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'plans' ? t('admin.subPlansTab') : t('admin.subActiveTab')}
            </button>
          ))}
        </div>
        {tab === 'plans' && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-smooth"
          >
            <Icon name="PlusIcon" size={16} />
            {t('admin.subNewPlan')}
          </button>
        )}
      </div>

      {/* PLANS TAB */}
      {tab === 'plans' && (
        plansLoading ? (
          <SkeletonList count={4} />
        ) : plans.length === 0 ? (
          <div className="bg-card rounded-md shadow-warm p-12 text-center">
            <Icon name="SparklesIcon" size={64} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('admin.subNoPlans')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-lg p-5 flex flex-col lg:flex-row lg:items-center gap-4 shadow-warm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                    <span className="text-xl font-heading font-bold text-foreground">{p.name}</span>
                    <span className="text-lg font-semibold text-primary">
                      {formatCurrency(Number(p.priceUzs), locale, 'UZS')}
                    </span>
                    {p.allCoursesAccess && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs font-medium">
                        <Icon name="CheckBadgeIcon" size={12} />
                        {t('admin.subAllAccess')}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                      {t('admin.subActive')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{t('admin.subDuration')}: {p.durationDays}</span>
                    {p.tier && <span>{p.tier}</span>}
                    {p.features?.length > 0 && <span className="truncate">{p.features.join(' · ')}</span>}
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground mt-2">{p.description}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(p)}
                    disabled={busyId === p.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-smooth disabled:opacity-50 ${p.isActive ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-success/10 text-success hover:bg-success/20'}`}
                  >
                    <Icon name={p.isActive ? 'EyeSlashIcon' : 'EyeIcon'} size={16} />
                    {t('admin.subToggleActive')}
                  </button>
                  <button
                    onClick={() => openEdit(p)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-md text-sm font-medium hover:bg-primary/20 transition-smooth"
                  >
                    <Icon name="PencilSquareIcon" size={16} />
                    {t('admin.subEditPlan')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ACTIVE SUBS TAB */}
      {tab === 'active' && (
        subsLoading ? (
          <SkeletonList count={4} />
        ) : subs.length === 0 ? (
          <div className="bg-card rounded-md shadow-warm p-12 text-center">
            <Icon name="UserGroupIcon" size={64} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('admin.subNoSubs')}</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden shadow-warm">
            <div className="hidden sm:grid grid-cols-3 gap-4 px-5 py-3 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>{t('admin.subUser')}</span>
              <span>{t('admin.subPlan')}</span>
              <span>{t('admin.subExpires')}</span>
            </div>
            <div className="divide-y divide-border">
              {subs.map((s) => (
                <div key={s.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.userName}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.userEmail}</p>
                  </div>
                  <div className="text-sm text-foreground self-center">{s.planName}</div>
                  <div className="text-sm text-muted-foreground self-center">
                    {formatDate(s.expiresAt, locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* PLAN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg shadow-warm-lg w-full max-w-lg p-6 my-8">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-4">
              {editingId ? t('admin.subEditPlan') : t('admin.subNewPlan')}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('admin.subPlanName')}</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('admin.descriptionSection')}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t('admin.subPrice')}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.priceUzs}
                    onChange={(e) => setForm((f) => ({ ...f, priceUzs: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">{t('admin.subDurationDays')}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.durationDays}
                    onChange={(e) => setForm((f) => ({ ...f, durationDays: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tier</label>
                  <input
                    value={form.tier}
                    onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">#</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('admin.subFeatures')}</label>
                <input
                  value={form.features}
                  onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.allCoursesAccess}
                    onChange={(e) => setForm((f) => ({ ...f, allCoursesAccess: e.target.checked }))}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                  />
                  {t('admin.subAllAccess')}
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-input text-primary focus:ring-2 focus:ring-ring"
                  />
                  {t('admin.subActive')}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-foreground rounded-md hover:bg-muted transition-smooth text-sm font-medium"
              >
                {t('admin.subCancel')}
              </button>
              <button
                onClick={submitForm}
                disabled={saving}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth text-sm font-medium disabled:opacity-50"
              >
                {t('admin.subSave')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
