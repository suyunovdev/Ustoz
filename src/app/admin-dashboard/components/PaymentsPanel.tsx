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

type StatusFilter = TransactionStatusDTO | 'all';
type MethodFilter = PaymentMethodDTO | 'all';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Barchasi' },
  { id: 'completed', label: 'Muvaffaqiyatli' },
  { id: 'pending', label: 'Kutilmoqda' },
  { id: 'failed', label: "Bo'lmadi" },
  { id: 'refunded', label: 'Qaytarilgan' },
  { id: 'cancelled', label: 'Bekor qilingan' },
];

const STATUS_BADGE: Record<TransactionStatusDTO, { label: string; color: string }> = {
  completed: { label: 'Muvaffaqiyatli', color: 'bg-success/10 text-success' },
  processing: { label: 'Jarayonda', color: 'bg-secondary/10 text-secondary' },
  pending: { label: 'Kutilmoqda', color: 'bg-warning/10 text-warning' },
  failed: { label: "Bo'lmadi", color: 'bg-destructive/10 text-destructive' },
  refunded: { label: 'Qaytarilgan', color: 'bg-primary/10 text-primary' },
  cancelled: { label: 'Bekor qilingan', color: 'bg-muted text-muted-foreground' },
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
      title: "To'lovni qaytarish",
      message: `${refundTarget.student.fullName} (${formatUzs(refundTarget.amountUzs)}) "${refundTarget.course.title}" kursi uchun to'lovni qaytaramizmi? Talaba kurs ro'yxatidan olib tashlanadi.`,
    };
  }, [refundTarget]);

  const handleRefund = () => {
    if (!refundTarget) return;
    if (refundReason.trim().length < 5) {
      toast.error("Sabab kamida 5 belgi bo'lishi kerak");
      return;
    }
    refundMutation.mutate(
      { transactionId: refundTarget.id, reason: refundReason },
      {
        onSuccess: () => {
          toast.success("To'lov qaytarildi");
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
          <StatCard label="Jami" value={stats.total} icon="CreditCardIcon" color="text-foreground" />
          <StatCard label="Muvaffaqiyatli" value={stats.completed} icon="CheckCircleIcon" color="text-success" />
          <StatCard label="Kutilmoqda" value={stats.pending} icon="ClockIcon" color="text-warning" />
          <StatCard label="Qaytarilgan" value={stats.refunded} icon="ArrowUturnLeftIcon" color="text-primary" />
          <StatCard label="Daromad" value={formatUzs(data?.totalRevenueUzs ?? '0')} icon="CurrencyDollarIcon" color="text-success" isText />
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
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as MethodFilter)}
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            >
              <option value="all">Barcha to'lov</option>
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
                placeholder="Email, ism, kurs..."
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
            Tranzaksiyalar ({data?.total ?? 0})
          </h3>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">Yangilanmoqda...</span>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4 text-sm text-destructive flex items-center justify-between">
            <span>Xato: {error.message}</span>
            <button onClick={() => refetch()} className="underline text-xs">
              Qayta urinish
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
            <p className="text-muted-foreground">To'lovlar topilmadi</p>
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
                          <strong>Refund sababi:</strong> {tx.refundReason}
                          <br />
                          <span className="text-[10px]">
                            Qaytarilgan: {formatDateTime(tx.refundedAt)}
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
                      {badge.label}
                    </span>
                    {isRefundable && (
                      <button
                        onClick={() => setRefundTarget(tx)}
                        className="text-xs px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-smooth flex items-center gap-1"
                      >
                        <Icon name="ArrowUturnLeftIcon" size={14} />
                        Qaytarish
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
          confirmLabel="Qaytarish"
          variant="danger"
          isLoading={refundMutation.isPending}
          onConfirm={handleRefund}
          onCancel={() => !refundMutation.isPending && setRefundTarget(null)}
        />
      )}
      {refundTarget && (
        <FeedbackOverlay
          label="Refund sababi (kamida 5 belgi)"
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
          placeholder="Sabab yozing..."
        />
      </div>
    </div>
  );
}

export default PaymentsPanel;
