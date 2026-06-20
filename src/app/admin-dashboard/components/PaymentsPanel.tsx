'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useAdminPayments,
  type AdminTransactionDTO,
  type TransactionStatusDTO,
  type PaymentMethodDTO,
} from '@/hooks/queries/useAdminPayments';
import { useRefundMutation } from '@/hooks/mutations/useRefundMutation';
import { useI18n } from '@/contexts/I18nContext';

type StatusFilter = TransactionStatusDTO | 'all';
type MethodFilter = PaymentMethodDTO | 'all';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'filterAll' },
  { id: 'completed', label: 'paymentCompleted' },
  { id: 'pending', label: 'paymentPending' },
  { id: 'failed', label: 'paymentFailed' },
  { id: 'refunded', label: 'paymentRefunded' },
  { id: 'cancelled', label: 'paymentCancelled' },
];

const STATUS_BADGE: Record<TransactionStatusDTO, { label: string; color: string }> = {
  completed: { label: 'paymentCompleted', color: 'bg-success/10 text-success' },
  processing: { label: 'paymentProcessing', color: 'bg-secondary/10 text-secondary' },
  pending: { label: 'paymentPending', color: 'bg-warning/10 text-warning' },
  failed: { label: 'paymentFailed', color: 'bg-destructive/10 text-destructive' },
  refunded: { label: 'paymentRefunded', color: 'bg-primary/10 text-primary' },
  cancelled: { label: 'paymentCancelled', color: 'bg-muted text-muted-foreground' },
};

const METHOD_LABEL: Record<PaymentMethodDTO, string> = {
  click: 'Click',
  payme: 'Payme',
};

function formatUzs(uzs: string): string {
  const n = Number(uzs);
  if (!Number.isFinite(n)) return "0 so'm";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M so'm`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`;
  return `${n.toLocaleString('uz-UZ')} so'm`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PaymentsPanel = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [method, setMethod] = useState<MethodFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [refundTarget, setRefundTarget] = useState<AdminTransactionDTO | null>(null);
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, error, refetch } = useAdminPayments({
    status,
    method,
    search: search || undefined,
  });

  const refundMutation = useRefundMutation();

  const transactions = data?.transactions ?? [];
  const stats = data?.stats;

  useEffect(() => {
    if (refundTarget) setRefundReason('');
  }, [refundTarget]);

  const refundModalProps = useMemo(() => {
    if (!refundTarget) return null;
    return {
      title: t('admin.refundPayment'),
      message: `${refundTarget.student.fullName} (${formatUzs(refundTarget.amountUzs)}) "${refundTarget.course.title}" kursi uchun to'lovni qaytaramizmi? Talaba kurs ro'yxatidan olib tashlanadi.`,
    };
  }, [refundTarget]);

  const handleRefund = () => {
    if (!refundTarget) return;
    if (refundReason.trim().length < 5) {
      toast.error(t('admin.noteRequired'));
      return;
    }
    refundMutation.mutate(
      { transactionId: refundTarget.id, reason: refundReason },
      {
        onSuccess: () => {
          toast.success(t('admin.paymentRefundedSuccess'));
          setRefundTarget(null);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label={t('admin.total')} value={stats.total} icon="CreditCardIcon" color="text-foreground" />
          <StatCard label={t('admin.paymentCompleted')} value={stats.completed} icon="CheckCircleIcon" color="text-success" />
          <StatCard label={t('admin.paymentPending')} value={stats.pending} icon="ClockIcon" color="text-warning" />
          <StatCard label={t('admin.paymentRefunded')} value={stats.refunded} icon="ArrowUturnLeftIcon" color="text-primary" />
          <StatCard label={t('admin.revenue')} value={formatUzs(data?.totalRevenueUzs ?? '0')} icon="CurrencyDollarIcon" color="text-success" isText />
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-md shadow-warm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 flex-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatus(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-smooth ${
                  status === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {t(`admin.${tab.label}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as MethodFilter)}
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            >
              <option value="all">{t('admin.allPayments')}</option>
              <option value="click">Click</option>
              <option value="payme">Payme</option>
            </select>

            <div className="relative flex-1 lg:flex-none">
              <Icon
                name="MagnifyingGlassIcon"
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('admin.searchPaymentPlaceholder')}
                className="pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            {t('admin.transactions')} ({data?.total ?? 0})
          </h3>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">{t('admin.updating')}</span>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4 text-sm text-destructive flex items-center justify-between">
            <span>{t('admin.error')}: {error.message}</span>
            <button onClick={() => refetch()} className="underline text-xs">
              {t('admin.retryBtn')}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="CreditCardIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('admin.paymentsNotFound')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const badge = STATUS_BADGE[tx.status];
              const isRefundable = tx.status === 'completed';
              return (
                <div
                  key={tx.id}
                  className="flex items-start justify-between gap-3 p-4 border border-border rounded-md hover:bg-muted/30 transition-smooth"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-md shrink-0">
                      <Icon name="CreditCardIcon" size={24} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-heading font-semibold text-foreground truncate">
                          {tx.student.fullName}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {METHOD_LABEL[tx.paymentMethod]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {tx.course.title} · {tx.student.email}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {formatUzs(tx.amountUzs)}
                        </span>
                        <span>📅 {formatDateTime(tx.createdAt)}</span>
                        {tx.merchantTransId && <span>#{tx.merchantTransId.slice(0, 12)}</span>}
                      </div>
                      {tx.refundedAt && tx.refundReason && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground border-l-2 border-primary">
                          <strong>{t('admin.refundReason')}:</strong> {tx.refundReason}
                          <br />
                          <span className="text-[10px]">
                            {t('admin.refundedAt')}: {formatDateTime(tx.refundedAt)}
                          </span>
                        </div>
                      )}
                      {tx.errorMessage && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                          {tx.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badge.color}`}>
                      {t(`admin.${badge.label}`)}
                    </span>
                    {isRefundable && (
                      <button
                        onClick={() => setRefundTarget(tx)}
                        className="text-xs px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-smooth flex items-center gap-1"
                      >
                        <Icon name="ArrowUturnLeftIcon" size={14} />
                        {t('admin.refundBtn')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Refund modal */}
      {refundModalProps && refundTarget && (
        <ConfirmModal
          open={true}
          title={refundModalProps.title}
          message={refundModalProps.message}
          confirmLabel={t('admin.refundBtn')}
          variant="danger"
          isLoading={refundMutation.isPending}
          onConfirm={handleRefund}
          onCancel={() => !refundMutation.isPending && setRefundTarget(null)}
        />
      )}
      {refundTarget && (
        <FeedbackOverlay
          label={t('admin.refundReasonLabel')}
          value={refundReason}
          onChange={setRefundReason}
          visible={true}
        />
      )}
    </div>
  );
};

function StatCard({
  label,
  value,
  icon,
  color,
  isText,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-card rounded-md shadow-warm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon name={icon} size={18} className={color} />
      </div>
      <p className={`font-heading font-bold ${color} ${isText ? 'text-lg' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  );
}

function FeedbackOverlay({
  label,
  value,
  onChange,
  visible,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[210] w-full max-w-md pointer-events-none"
      style={{ bottom: '30%' }}
    >
      <div className="bg-card border border-border rounded-md shadow-warm-lg p-3 mx-4 pointer-events-auto">
        <label className="block text-xs text-muted-foreground mb-1">{label}</label>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full p-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder={t('admin.reasonPlaceholder')}
        />
      </div>
    </div>
  );
}

export default PaymentsPanel;
