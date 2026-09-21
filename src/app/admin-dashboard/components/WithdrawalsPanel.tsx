'use client';

/**
 * WithdrawalsPanel — o'qituvchi pul yechish so'rovlari (CRM jadval + detail drawer).
 * GET  /api/admin/withdrawals?status=pending|processing
 * PATCH /api/admin/withdrawals/[id] { action: approve|complete|reject, rejectionReason? }
 */
import { useEffect, useState, useCallback } from 'react';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Toolbar, SearchInput, FilterChips } from '@/components/ui/Toolbar';
import ErrorState from '@/components/common/ErrorState';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatDate } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

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

function fmtDate(iso: string, locale: Locale) {
  return formatDate(iso, locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function WithdrawalsPanel() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<'pending' | 'processing'>('pending');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [active, setActive] = useState<WithdrawalRow | null>(null);
  const [drawerReject, setDrawerReject] = useState(false);
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
        action === 'approve' ? t('admin.wdApproved') : action === 'complete' ? t('admin.wdCompleted') : t('admin.wdRejected'),
      );
      setActive(null);
      setDrawerReject(false);
      setReason('');
      setRows((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t('admin.wdError'));
    } finally {
      setBusyId(null);
    }
  };

  const q = search.toLowerCase();
  const visible = q
    ? rows.filter((w) => w.teacherName.toLowerCase().includes(q) || w.teacherEmail.toLowerCase().includes(q))
    : rows;

  const methodBadge = (m: string): { variant: BadgeVariant; label: string } =>
    m === 'card' ? { variant: 'primary', label: t('admin.wdCard') } : { variant: 'secondary', label: t('admin.wdBank') };

  const columns: Column<WithdrawalRow>[] = [
    {
      key: 'amountUzs',
      header: t('admin.colAmount'),
      cellClassName: 'font-semibold text-foreground whitespace-nowrap',
      render: (w) => formatCurrency(Number(w.amountUzs), locale, 'UZS'),
    },
    {
      key: 'teacher',
      header: t('admin.colTeacher'),
      render: (w) => (
        <div className="min-w-0">
          <div className="font-medium text-foreground truncate">{w.teacherName}</div>
          <div className="text-xs text-muted-foreground truncate">{w.teacherEmail}</div>
        </div>
      ),
    },
    {
      key: 'method',
      header: t('admin.colMethod'),
      render: (w) => {
        const b = methodBadge(w.method);
        return <Badge variant={b.variant}>{b.label}</Badge>;
      },
    },
    {
      key: 'requestedAt',
      header: t('admin.wdRequestedAt'),
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap',
      render: (w) => fmtDate(w.requestedAt, locale),
    },
  ];

  return (
    <div className="space-y-4">
      <Toolbar>
        <FilterChips
          options={[
            { id: 'pending', label: t('admin.wdStatusPending') },
            { id: 'processing', label: t('admin.wdStatusProcessing') },
          ]}
          value={tab}
          onChange={(v) => { setTab(v); setSearch(''); }}
        />
        <SearchInput placeholder={t('admin.searchByEmailOrName')} onSearch={setSearch} />
      </Toolbar>

      {error ? (
        <div className="bg-card rounded-lg border border-border">
          <ErrorState message={t('admin.wdError')} onRetry={load} />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={visible}
          getRowId={(w) => w.id}
          onRowClick={(w) => { setActive(w); setDrawerReject(false); setReason(''); }}
          isLoading={loading}
          emptyIcon="CheckBadgeIcon"
          emptyTitle={t('admin.wdNoRequests')}
        />
      )}

      <Drawer
        open={active !== null}
        onClose={() => setActive(null)}
        title={active ? formatCurrency(Number(active.amountUzs), locale, 'UZS') : undefined}
        subtitle={active?.teacherName}
        width="md"
        footer={
          active ? (
            drawerReject ? (
              <>
                <Button variant="ghost" onClick={() => setDrawerReject(false)}>{t('admin.wdCancel')}</Button>
                <Button
                  variant="destructive"
                  loading={busyId === active.id}
                  onClick={() => {
                    if (!reason.trim()) return toast.error(t('admin.wdReason'));
                    decide(active.id, 'reject', reason.trim());
                  }}
                >
                  {t('admin.wdConfirm')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="text-destructive" iconLeft="XMarkIcon" onClick={() => { setDrawerReject(true); setReason(''); }}>
                  {t('admin.wdReject')}
                </Button>
                {active.status === 'pending' && (
                  <Button variant="secondary" iconLeft="CheckIcon" loading={busyId === active.id} onClick={() => decide(active.id, 'approve')}>
                    {t('admin.wdApprove')}
                  </Button>
                )}
                <Button variant="primary" iconLeft="BanknotesIcon" loading={busyId === active.id} onClick={() => decide(active.id, 'complete')}>
                  {t('admin.wdComplete')}
                </Button>
              </>
            )
          ) : null
        }
      >
        {active && (
          <div className="space-y-4 text-sm">
            <Row label={t('admin.colEmail')}>{active.teacherEmail}</Row>
            <Row label={t('admin.colMethod')}>{methodBadge(active.method).label}</Row>
            {active.method === 'card' ? (
              <Row label={t('admin.wdCard')}>{active.cardNumber ?? '—'}</Row>
            ) : (
              <>
                <Row label={t('admin.wdBank')}>{active.bankName ?? '—'}</Row>
                <Row label="Hisob raqami">{active.bankAccountNumber ?? '—'}</Row>
              </>
            )}
            {active.recipientName && <Row label={t('admin.wdRecipient')}>{active.recipientName}</Row>}
            <Row label={t('admin.wdRequestedAt')}>{fmtDate(active.requestedAt, locale)}</Row>
            {active.note && (
              <div className="p-3 bg-muted/50 rounded-md text-muted-foreground italic">&quot;{active.note}&quot;</div>
            )}
            {drawerReject && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.wdReason')}</label>
                <textarea
                  autoFocus
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t('admin.wdReasonPlaceholder')}
                  className="w-full p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-card"
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground text-right break-words">{children}</span>
    </div>
  );
}
