'use client';

import { useEffect, useMemo, useState } from 'react';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';
import { DataTable, type Column, type SortState } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { Toolbar, SearchInput, FilterChips } from '@/components/ui/Toolbar';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useAdminPayments,
  type AdminTransactionDTO,
  type AdminPaymentsSortField,
  type TransactionStatusDTO,
  type PaymentMethodDTO,
} from '@/hooks/queries/useAdminPayments';
import { useRefundMutation } from '@/hooks/mutations/useRefundMutation';
import { useI18n } from '@/contexts/I18nContext';
import { type Locale } from '@/lib/i18n';
import { formatDateTime, formatCurrency } from '@/lib/i18n/format';
import CoursePurchaseRequestsPanel from './CoursePurchaseRequestsPanel';

type StatusFilter = TransactionStatusDTO | 'all';
type MethodFilter = PaymentMethodDTO | 'all';

const STATUS_VARIANT: Record<TransactionStatusDTO, BadgeVariant> = {
  completed: 'success',
  processing: 'secondary',
  pending: 'warning',
  failed: 'destructive',
  refunded: 'primary',
  cancelled: 'muted',
};

const STATUS_LABEL_KEY: Record<TransactionStatusDTO, string> = {
  completed: 'admin.paymentCompleted',
  processing: 'admin.paymentProcessing',
  pending: 'admin.paymentPending',
  failed: 'admin.paymentFailed',
  refunded: 'admin.paymentRefunded',
  cancelled: 'admin.paymentCancelled',
};

const METHOD_LABEL: Record<PaymentMethodDTO, string> = {
  click: 'Click',
  payme: 'Payme',
};

function formatUzs(uzs: string, locale: Locale): string {
  const n = Number(uzs);
  if (!Number.isFinite(n)) return formatCurrency(0, locale, 'UZS');
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M so'm`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`;
  return formatCurrency(n, locale, 'UZS');
}

function fmtDateTime(iso: string | null, locale: Locale): string {
  if (!iso) return '—';
  return formatDateTime(iso, locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const PaymentsPanel = () => {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [method, setMethod] = useState<MethodFilter>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', dir: 'desc' });
  const [refundTarget, setRefundTarget] = useState<AdminTransactionDTO | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const { data, isLoading, isFetching, error, refetch } = useAdminPayments({
    status,
    method,
    search: search || undefined,
    page,
    pageSize,
    sort: sort.key as AdminPaymentsSortField,
    order: sort.dir,
  });

  const refundMutation = useRefundMutation();

  const transactions = data?.transactions ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats;

  const resetTo = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };
  const handleSort = (s: SortState) => {
    setSort(s);
    setPage(1);
  };

  useEffect(() => {
    if (refundTarget) setRefundReason('');
  }, [refundTarget]);

  const STATUS_FILTERS: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'all', label: t('admin.filterAll') },
    { id: 'completed', label: t('admin.paymentCompleted'), count: stats?.completed },
    { id: 'pending', label: t('admin.paymentPending'), count: stats?.pending },
    { id: 'failed', label: t('admin.paymentFailed'), count: stats?.failed },
    { id: 'refunded', label: t('admin.paymentRefunded'), count: stats?.refunded },
    { id: 'cancelled', label: t('admin.paymentCancelled'), count: stats?.cancelled },
  ];

  const refundModalProps = useMemo(() => {
    if (!refundTarget) return null;
    return {
      title: t('admin.refundPayment'),
      message: `${refundTarget.student.fullName} (${formatUzs(refundTarget.amountUzs, locale)}) "${refundTarget.course?.title ?? t('payment.subscription')}" uchun to'lovni qaytaramizmi? Talaba kurs ro'yxatidan olib tashlanadi.`,
    };
  }, [refundTarget, locale, t]);

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

  const columns: Column<AdminTransactionDTO>[] = [
    {
      key: 'createdAt',
      header: t('admin.colDate'),
      sortable: true,
      cellClassName: 'text-muted-foreground whitespace-nowrap',
      render: (tx) => fmtDateTime(tx.createdAt, locale),
    },
    {
      key: 'student',
      header: t('admin.colStudent'),
      render: (tx) => (
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate">{tx.student.fullName}</div>
          <div className="text-xs text-muted-foreground truncate">{tx.student.email}</div>
        </div>
      ),
    },
    {
      key: 'course',
      header: t('admin.colCourse'),
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground',
      render: (tx) => <span className="truncate">{tx.course?.title ?? t('payment.subscription')}</span>,
    },
    {
      key: 'amountUzs',
      header: t('admin.colAmount'),
      sortable: true,
      align: 'right',
      cellClassName: 'font-semibold text-foreground whitespace-nowrap',
      render: (tx) => formatUzs(tx.amountUzs, locale),
    },
    {
      key: 'method',
      header: t('admin.colMethod'),
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell text-muted-foreground',
      render: (tx) => METHOD_LABEL[tx.paymentMethod],
    },
    {
      key: 'status',
      header: t('admin.colStatus'),
      render: (tx) => (
        <Badge variant={STATUS_VARIANT[tx.status]}>{t(STATUS_LABEL_KEY[tx.status])}</Badge>
      ),
    },
    {
      key: 'actions',
      header: t('admin.colActions'),
      align: 'right',
      render: (tx) =>
        tx.status === 'completed' ? (
          <Button
            variant="outline"
            size="sm"
            iconLeft="ArrowUturnLeftIcon"
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={() => setRefundTarget(tx)}
          >
            {t('admin.refundBtn')}
          </Button>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Kurs sotib olish so'rovlari (to'lov shlyuzisiz — admin tasdig'i) */}
      <CoursePurchaseRequestsPanel />

      {stats && (
        <StatCardGrid className="lg:grid-cols-5">
          <StatCard label={t('admin.total')} value={stats.total} icon="CreditCardIcon" iconColor="text-foreground" />
          <StatCard label={t('admin.paymentCompleted')} value={stats.completed} icon="CheckCircleIcon" iconColor="text-success" />
          <StatCard label={t('admin.paymentPending')} value={stats.pending} icon="ClockIcon" iconColor="text-warning" />
          <StatCard label={t('admin.paymentRefunded')} value={stats.refunded} icon="ArrowUturnLeftIcon" iconColor="text-primary" />
          <StatCard label={t('admin.revenue')} value={formatUzs(data?.totalRevenueUzs ?? '0', locale)} icon="CurrencyDollarIcon" iconColor="text-success" />
        </StatCardGrid>
      )}

      <div className="overflow-x-auto -mx-1 px-1">
        <FilterChips
          options={STATUS_FILTERS}
          value={status}
          onChange={resetTo(setStatus)}
          className="flex-nowrap"
        />
      </div>

      <Toolbar>
        <select
          value={method}
          onChange={(e) => resetTo(setMethod)(e.target.value as MethodFilter)}
          className="h-10 px-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
        >
          <option value="all">{t('admin.allPayments')}</option>
          <option value="click">Click</option>
          <option value="payme">Payme</option>
        </select>
        <SearchInput placeholder={t('admin.searchPaymentPlaceholder')} onSearch={resetTo(setSearch)} />
      </Toolbar>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm text-destructive flex items-center justify-between">
          <span>{t('admin.error')}: {error.message}</span>
          <button onClick={() => refetch()} className="underline text-xs">
            {t('admin.retryBtn')}
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={transactions}
        getRowId={(tx) => tx.id}
        sort={sort}
        onSortChange={handleSort}
        isLoading={isLoading}
        emptyIcon="CreditCardIcon"
        emptyTitle={t('admin.paymentsNotFound')}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={resetTo(setPageSize)}
        isFetching={isFetching}
      />

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
  const { t } = useI18n();
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
};

export default PaymentsPanel;
