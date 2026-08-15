'use client';

/**
 * WithdrawalsPanel — admin uchun o'qituvchi pul yechish so'rovlari boshqaruvi.
 * GET  /api/admin/withdrawals?status=pending
 * PATCH /api/admin/withdrawals/[id] { action: approve|complete|reject, rejectionReason? }
 */
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { SkeletonList } from '@/components/ui/Skeleton';
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
  const [tab, setTab] = useState<'pending' | 'processing'>('pending');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals?status=${tab}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.withdrawals || []);
    } catch {
      toast.error(t('admin.wdError'));
    } finally {
      setLoading(false);
    }
  }, [t, tab]);

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
      setModal(null);
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
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-md shadow-warm p-12 text-center">
          <Icon name="CheckBadgeIcon" size={64} className="text-success mx-auto mb-4" />
          <p className="text-muted-foreground">{t('admin.wdNoRequests')}</p>
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
                  <button
                    onClick={() => decide(w.id, 'approve')}
                    disabled={busyId === w.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary/10 text-secondary rounded-md text-sm font-medium hover:bg-secondary/20 transition-smooth disabled:opacity-50"
                  >
                    <Icon name="CheckIcon" size={16} />
                    {t('admin.wdApprove')}
                  </button>
                )}
                <button
                  onClick={() => decide(w.id, 'complete')}
                  disabled={busyId === w.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-success text-success-foreground rounded-md text-sm font-medium hover:bg-success/90 transition-smooth disabled:opacity-50"
                >
                  <Icon name="BanknotesIcon" size={16} />
                  {t('admin.wdComplete')}
                </button>
                <button
                  onClick={() => { setReason(''); setModal(w.id); }}
                  disabled={busyId === w.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-smooth disabled:opacity-50"
                >
                  <Icon name="XMarkIcon" size={16} />
                  {t('admin.wdReject')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-lg shadow-warm-lg w-full max-w-md p-6">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-1">{t('admin.wdReject')}</h3>
            <label className="block text-sm font-medium text-foreground mt-4 mb-1">{t('admin.wdReason')}</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t('admin.wdReasonPlaceholder')}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-foreground rounded-md hover:bg-muted transition-smooth text-sm font-medium">
                {t('admin.wdCancel')}
              </button>
              <button
                onClick={() => {
                  if (!reason.trim()) { toast.error(t('admin.wdReason')); return; }
                  decide(modal, 'reject', reason.trim());
                }}
                disabled={busyId === modal}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-smooth text-sm font-medium disabled:opacity-50"
              >
                {t('admin.wdConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
