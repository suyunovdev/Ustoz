'use client';

import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';
import { DataTable, type Column, type SortState } from '@/components/ui/DataTable';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Toolbar, SearchInput, FilterChips } from '@/components/ui/Toolbar';
import { BulkActionBar } from '@/components/ui/BulkActionBar';
import { toast } from '@/components/common/Toaster';
import {
  useAdminTeacherApplications,
  type TeacherApplicationDTO,
  type ApplicationStatusDTO,
  type AdminApplicationsSortField,
} from '@/hooks/queries/useAdminTeacherApplications';
import { useReviewTeacherAppMutation } from '@/hooks/mutations/useReviewTeacherAppMutation';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate as fmtDate } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

type StatusFilter = ApplicationStatusDTO | 'all';

const STATUS_VARIANT: Record<ApplicationStatusDTO, BadgeVariant> = {
  pending: 'warning',
  under_review: 'secondary',
  approved: 'success',
  rejected: 'destructive',
};
const STATUS_LABEL_KEY: Record<ApplicationStatusDTO, string> = {
  pending: 'admin.statusNew',
  under_review: 'admin.statusUnderReview',
  approved: 'admin.statusApproved',
  rejected: 'admin.statusRejected',
};

function formatDate(iso: string | null, locale: Locale): string {
  return iso ? fmtDate(iso, locale, {}) : '—';
}

const isActionable = (s: ApplicationStatusDTO) => s === 'pending' || s === 'under_review';

const TeacherApplicationsPanel = () => {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', dir: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<TeacherApplicationDTO | null>(null);
  const [drawerReject, setDrawerReject] = useState(false);
  const [reason, setReason] = useState('');
  const [bulkReason, setBulkReason] = useState<{ open: boolean; text: string }>({ open: false, text: '' });

  const { data, isLoading, isFetching, error, refetch } = useAdminTeacherApplications({
    status,
    search: search || undefined,
    page,
    pageSize,
    sort: sort.key as AdminApplicationsSortField,
    order: sort.dir,
  });
  const mutation = useReviewTeacherAppMutation();

  const apps = data?.applications ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats;

  const resetTo = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
    setSelectedIds(new Set());
  };
  const handleSort = (s: SortState) => {
    setSort(s);
    setPage(1);
  };
  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = (ids: string[], checked: boolean) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => (checked ? n.add(id) : n.delete(id)));
      return n;
    });

  const openDrawer = (app: TeacherApplicationDTO) => {
    setActive(app);
    setDrawerReject(false);
    setReason('');
  };
  const closeDrawer = () => setActive(null);

  const runSingle = async (
    app: TeacherApplicationDTO,
    action: 'start_review' | 'approve' | 'reject',
    feedback?: string,
  ) => {
    try {
      if (action === 'reject') {
        await mutation.mutateAsync({ applicationId: app.id, action: 'reject', feedback: feedback! });
        toast.success(t('admin.appRejected'));
      } else if (action === 'approve') {
        await mutation.mutateAsync({ applicationId: app.id, action: 'approve' });
        toast.success(t('admin.appApproved'));
      } else {
        await mutation.mutateAsync({ applicationId: app.id, action: 'start_review' });
        toast.success(t('admin.reviewStarted'));
      }
      closeDrawer();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const runBulk = async (action: 'approve' | 'reject', feedback?: string) => {
    const targets = apps.filter((a) => selectedIds.has(a.id) && isActionable(a.status));
    if (targets.length === 0) return;
    const results = await Promise.allSettled(
      targets.map((a) =>
        action === 'reject'
          ? mutation.mutateAsync({ applicationId: a.id, action: 'reject', feedback: feedback! })
          : mutation.mutateAsync({ applicationId: a.id, action: 'approve' }),
      ),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    toast.success(`${ok} ${t('admin.bulkSelected')}${fail ? ` · ${fail} ✕` : ''}`);
    setSelectedIds(new Set());
    setBulkReason({ open: false, text: '' });
  };

  const FILTERS: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'all', label: t('admin.statusAll') },
    { id: 'pending', label: t('admin.statusNew'), count: stats?.pending },
    { id: 'under_review', label: t('admin.statusUnderReview'), count: stats?.under_review },
    { id: 'approved', label: t('admin.statusApproved'), count: stats?.approved },
    { id: 'rejected', label: t('admin.statusRejected'), count: stats?.rejected },
  ];

  const columns: Column<TeacherApplicationDTO>[] = [
    {
      key: 'fullName',
      header: t('admin.colUser'),
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={a.user.avatarUrl} name={a.fullName} size={36} />
          <span className="font-medium text-foreground truncate">{a.fullName}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: t('admin.colEmail'),
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell text-muted-foreground',
      render: (a) => <span className="truncate">{a.email}</span>,
    },
    {
      key: 'expertise',
      header: t('admin.expertiseSection'),
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground',
      render: (a) => <span className="truncate">{a.expertise}</span>,
    },
    {
      key: 'status',
      header: t('admin.colStatus'),
      render: (a) => <Badge variant={STATUS_VARIANT[a.status]}>{t(STATUS_LABEL_KEY[a.status])}</Badge>,
    },
    {
      key: 'createdAt',
      header: t('admin.colCreated'),
      sortable: true,
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap',
      render: (a) => formatDate(a.createdAt, locale),
    },
  ];

  return (
    <div className="space-y-4">
      {stats && (
        <StatCardGrid>
          <StatCard label={t('admin.total')} value={stats.total} icon="AcademicCapIcon" iconColor="text-foreground" />
          <StatCard label={t('admin.statusNew')} value={stats.pending} icon="ClockIcon" iconColor="text-warning" />
          <StatCard label={t('admin.statusUnderReview')} value={stats.under_review} icon="EyeIcon" iconColor="text-secondary" />
          <StatCard label={t('admin.statusApproved')} value={stats.approved} icon="CheckCircleIcon" iconColor="text-success" />
        </StatCardGrid>
      )}

      <Toolbar>
        <div className="overflow-x-auto -mx-1 px-1">
          <FilterChips options={FILTERS} value={status} onChange={resetTo(setStatus)} className="flex-nowrap" />
        </div>
        <SearchInput placeholder={t('admin.searchNameEmailField')} onSearch={resetTo(setSearch)} />
      </Toolbar>

      <BulkActionBar
        count={selectedIds.size}
        label={(c) => `${c} ${t('admin.bulkSelected')}`}
        onClear={() => setSelectedIds(new Set())}
        isLoading={mutation.isPending}
        actions={[
          { label: t('admin.bulkApprove'), icon: 'CheckCircleIcon', variant: 'primary', onClick: () => runBulk('approve') },
          { label: t('admin.bulkReject'), icon: 'XCircleIcon', variant: 'outline', onClick: () => setBulkReason({ open: true, text: '' }) },
        ]}
      />

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm text-destructive flex items-center justify-between">
          <span>{t('admin.error')}: {error.message}</span>
          <button onClick={() => refetch()} className="underline text-xs">{t('admin.retryBtn')}</button>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={apps}
        getRowId={(a) => a.id}
        onRowClick={openDrawer}
        sort={sort}
        onSortChange={handleSort}
        isLoading={isLoading}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        emptyIcon="AcademicCapIcon"
        emptyTitle={t('admin.applicationsNotFound')}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={resetTo(setPageSize)}
        isFetching={isFetching}
      />

      {/* Detail drawer */}
      <Drawer
        open={active !== null}
        onClose={closeDrawer}
        title={active?.fullName}
        subtitle={active ? t(STATUS_LABEL_KEY[active.status]) : undefined}
        width="lg"
        footer={
          active && isActionable(active.status) ? (
            drawerReject ? (
              <>
                <Button variant="ghost" onClick={() => setDrawerReject(false)}>{t('common.cancel')}</Button>
                <Button
                  variant="destructive"
                  loading={mutation.isPending}
                  onClick={() => {
                    if (reason.trim().length < 5) return toast.error(t('admin.noteRequired'));
                    runSingle(active, 'reject', reason.trim());
                  }}
                >
                  {t('admin.reject')}
                </Button>
              </>
            ) : (
              <>
                {active.status === 'pending' && (
                  <Button variant="ghost" iconLeft="EyeIcon" loading={mutation.isPending} onClick={() => runSingle(active, 'start_review')}>
                    {t('admin.startReview')}
                  </Button>
                )}
                <Button variant="outline" iconLeft="XCircleIcon" className="text-destructive" onClick={() => setDrawerReject(true)}>
                  {t('admin.reject')}
                </Button>
                <Button variant="primary" iconLeft="CheckCircleIcon" loading={mutation.isPending} onClick={() => runSingle(active, 'approve')}>
                  {t('admin.approve')}
                </Button>
              </>
            )
          ) : null
        }
      >
        {active && (
          <div className="space-y-5 text-sm">
            <Field label={t('admin.contactSection')}>
              <div>{active.email}</div>
              {active.phone && <div className="text-muted-foreground">{active.phone}</div>}
            </Field>
            <Field label={t('admin.expertiseSection')}>{active.expertise}</Field>
            <Field label={t('admin.bioSection')}>{active.bio}</Field>
            <Field label={t('admin.motivationSection')}>{active.motivation}</Field>
            {active.experience && <Field label={t('admin.experienceSection')}>{active.experience}</Field>}
            {active.sampleUrl && (
              <Field label={t('admin.sampleWorkSection')}>
                <a href={active.sampleUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                  {active.sampleUrl}
                </a>
              </Field>
            )}
            {active.feedback && (
              <div className="p-3 bg-muted/50 rounded-md border-l-2 border-primary text-muted-foreground">
                <strong>{t('admin.adminResponse')}:</strong> {active.feedback}
              </div>
            )}
            {drawerReject && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.rejectReasonLabel')}</label>
                <textarea
                  autoFocus
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-card"
                  placeholder={t('admin.writePlaceholder')}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Bulk reject reason */}
      <Modal
        open={bulkReason.open}
        onClose={() => setBulkReason({ open: false, text: '' })}
        title={t('admin.bulkReasonTitle')}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBulkReason({ open: false, text: '' })}>{t('common.cancel')}</Button>
            <Button
              variant="destructive"
              loading={mutation.isPending}
              onClick={() => {
                if (bulkReason.text.trim().length < 5) return toast.error(t('admin.noteRequired'));
                runBulk('reject', bulkReason.text.trim());
              }}
            >
              {t('admin.bulkReject')}
            </Button>
          </>
        }
      >
        <textarea
          autoFocus
          rows={3}
          value={bulkReason.text}
          onChange={(e) => setBulkReason((s) => ({ ...s, text: e.target.value }))}
          className="w-full p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-card"
          placeholder={t('admin.writePlaceholder')}
        />
      </Modal>
    </div>
  );
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70 mb-1">{label}</p>
      <div className="text-foreground whitespace-pre-wrap break-words">{children}</div>
    </div>
  );
}

export default TeacherApplicationsPanel;
