'use client';

/**
 * WithdrawalsPanel — admin uchun o'qituvchi pul yechish so'rovlari boshqaruvi.
 * GET  /api/admin/withdrawals?status=pending
 * PATCH /api/admin/withdrawals/[id] { action: approve|complete|reject, rejectionReason? }
 */
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';
import { formatCurrency, formatDate } from '@/lib/i18n/format';

interface WithdrawalRow {
  id: string;
  teacherName: string;
  teacherEmail: string;
  amountUzs: string;
  status: string;
  method: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  cardNumber: string | null;
  recipientName: string | null;
  note: string | null;
  requestedAt: string;
}

type Action = 'approve' | 'complete' | 'reject';

export default function WithdrawalsPanel() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'pending' | 'processing'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  // Tasdiqni talab qiladigan (pul harakati) amallar — ConfirmModal orqali
  const [confirm, setConfirm] = useState<{ id: string; action: 'approve' | 'complete' } | null>(null);
  // Rad etish — sabab modal ichida
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${tab}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.withdrawals || []);
    } catch {
      // Xato = "bo'sh navbat" EMAS — bu pul to'lovlari, aniq xato holati ko'rsatiladi
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, action: Action, rejectionReason?: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, rejectionReason }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || '');
      }
      toast.success(
        action === 'approve' ? t('admin.wdApproved')
          : action === 'complete' ? t('admin.wdCompleted')
            : t('admin.wdRejected'),
      );
      setConfirm(null);
      setRejectId(null);
      setReason('');
      setRows((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t('admin.wdError'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-heading font-bold text-foreground">{t('admin.withdrawalsTitle')}</h2>
        <div className="inline-flex rounded-md border border-border bg-card p-1">
          {(['pending', 'processing'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setTab(s)}
              className={`px-4 py-2 rounded text-sm font-medium transition-smooth ${tab === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'pending' ? t('admin.wdStatusPending') : t('admin.wdStatusProcessing')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <div className="bg-card rounded-md shadow-warm">
          <ErrorState message={t('admin.wdError')} onRetry={load} />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-md shadow-warm">
          <EmptyState icon="CheckBadgeIcon" title={t('admin.wdNoRequests')} />
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((w) => (
            <div key={w.id} className="bg-card border border-border rounded-lg p-5 flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-1">
                  <span className="text-xl font-heading font-bold text-foreground">
                    {formatCurrency(Number(w.amountUzs), locale, 'UZS')}
                  </span>
                  <span className="text-sm text-muted-foreground">{w.teacherName}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{w.teacherEmail}</span>
                  <span className="flex items-center gap-1">
                    <Icon name={w.method === 'card' ? 'CreditCardIcon' : 'BuildingLibraryIcon'} size={14} />
                    {w.method === 'card'
                      ? `${t('admin.wdCard')}: ${w.cardNumber ?? '—'}`
                      : `${t('admin.wdBank')}: ${w.bankName ?? '—'} ${w.bankAccountNumber ?? ''}`}
                  </span>
                  {w.recipientName && <span>{t('admin.wdRecipient')}: {w.recipientName}</span>}
                  <span>{t('admin.wdRequestedAt')}: {formatDate(w.requestedAt, locale, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                </div>
                {w.note && <p className="text-sm text-muted-foreground mt-2 italic">"{w.note}"</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {w.status === 'pending' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    iconLeft="CheckIcon"
                    disabled={busyId === w.id}
                    onClick={() => setConfirm({ id: w.id, action: 'approve' })}
                  >
                    {t('admin.wdApprove')}
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft="BanknotesIcon"
                  disabled={busyId === w.id}
                  onClick={() => setConfirm({ id: w.id, action: 'complete' })}
                >
                  {t('admin.wdComplete')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  iconLeft="XMarkIcon"
                  disabled={busyId === w.id}
                  onClick={() => { setReason(''); setRejectId(w.id); }}
                >
                  {t('admin.wdReject')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve / Complete — pul harakati, tasdiq talab qilinadi */}
      <ConfirmModal
        open={confirm !== null}
        title={confirm?.action === 'approve' ? t('admin.wdApprove') : t('admin.wdComplete')}
        message={confirm?.action === 'approve' ? t('admin.wdApprove') : t('admin.wdComplete')}
        confirmLabel={confirm?.action === 'approve' ? t('admin.wdApprove') : t('admin.wdComplete')}
        variant="danger"
        isLoading={confirm !== null && busyId === confirm.id}
        onConfirm={() => confirm && decide(confirm.id, confirm.action)}
        onCancel={() => busyId === null && setConfirm(null)}
      />

      {/* Rad etish — sabab modal ichida */}
      <Modal
        open={rejectId !== null}
        onClose={() => { if (busyId === null) { setRejectId(null); setReason(''); } }}
        title={t('admin.wdReject')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setRejectId(null); setReason(''); }} disabled={busyId !== null}>
              {t('admin.wdCancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={rejectId !== null && busyId === rejectId}
              onClick={() => {
                if (!reason.trim()) { toast.error(t('admin.wdReason')); return; }
                if (rejectId) decide(rejectId, 'reject', reason.trim());
              }}
            >
              {t('admin.wdConfirm')}
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-foreground mb-1">{t('admin.wdReason')}</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder={t('admin.wdReasonPlaceholder')}
          className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          autoFocus
        />
      </Modal>
    </div>
  );
}
