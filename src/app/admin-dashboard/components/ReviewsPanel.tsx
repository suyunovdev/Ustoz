'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
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
  useAdminReviews,
  type AdminReviewDTO,
  type ReviewStatusDTO,
  type AdminReviewsSortField,
} from '@/hooks/queries/useAdminReviews';
import { useReviewActionMutation } from '@/hooks/mutations/useReviewActionMutation';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate as fmtDate } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon
          key={i}
          name="StarIcon"
          variant={i <= value ? 'solid' : 'outline'}
          size={13}
          className={i <= value ? 'text-accent' : 'text-muted-foreground/40'}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string | null, locale: Locale): string {
  return iso ? fmtDate(iso, locale, {}) : '—';
}

const ReviewsPanel = () => {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<ReviewStatusDTO>('all');
  const [rating, setRating] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', dir: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<AdminReviewDTO | null>(null);
  const [drawerAction, setDrawerAction] = useState<'hide' | 'delete' | null>(null);
  const [reason, setReason] = useState('');
  const [bulkReason, setBulkReason] = useState<{ open: boolean; text: string }>({ open: false, text: '' });

  const { data, isLoading, isFetching, error, refetch } = useAdminReviews({
    status,
    rating,
    search: search || undefined,
    page,
    pageSize,
    sort: sort.key as AdminReviewsSortField,
    order: sort.dir,
  });
  const mutation = useReviewActionMutation();

  const reviews = data?.reviews ?? [];
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

  const openDrawer = (r: AdminReviewDTO) => {
    setActive(r);
    setDrawerAction(null);
    setReason('');
  };

  const runSingle = async (r: AdminReviewDTO, action: 'hide' | 'unhide' | 'delete', reasonText?: string) => {
    try {
      if (action === 'unhide') {
        await mutation.mutateAsync({ reviewId: r.id, action: 'unhide' });
        toast.success(t('admin.reviewUnhidden'));
      } else if (action === 'hide') {
        await mutation.mutateAsync({ reviewId: r.id, action: 'hide', reason: reasonText! });
        toast.success(t('admin.reviewHidden'));
      } else {
        await mutation.mutateAsync({ reviewId: r.id, action: 'delete', reason: reasonText! });
        toast.success(t('admin.reviewDeleted'));
      }
      setActive(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const runBulk = async (action: 'hide' | 'unhide', reasonText?: string) => {
    const targets = reviews.filter(
      (r) => selectedIds.has(r.id) && (action === 'hide' ? r.hiddenAt === null : r.hiddenAt !== null),
    );
    if (targets.length === 0) return;
    const results = await Promise.allSettled(
      targets.map((r) =>
        action === 'hide'
          ? mutation.mutateAsync({ reviewId: r.id, action: 'hide', reason: reasonText! })
          : mutation.mutateAsync({ reviewId: r.id, action: 'unhide' }),
      ),
    );
    const ok = results.filter((x) => x.status === 'fulfilled').length;
    const fail = results.length - ok;
    toast.success(`${ok} ${t('admin.bulkSelected')}${fail ? ` · ${fail} ✕` : ''}`);
    setSelectedIds(new Set());
    setBulkReason({ open: false, text: '' });
  };

  const FILTERS: { id: ReviewStatusDTO; label: string; count?: number }[] = [
    { id: 'all', label: t('admin.statusAll') },
    { id: 'visible', label: t('admin.visibleLabel'), count: stats?.visible },
    { id: 'hidden', label: t('admin.hiddenLabel'), count: stats?.hidden },
    { id: 'reported', label: t('admin.reported'), count: stats?.reported },
  ];

  const columns: Column<AdminReviewDTO>[] = [
    {
      key: 'student',
      header: t('admin.colStudent'),
      render: (r) => (
        <div className="flex items-center gap-3 min-w-0">
          <Avatar src={r.student.avatarUrl} name={r.student.fullName} size={32} />
          <span className="font-medium text-foreground truncate">{r.student.fullName}</span>
        </div>
      ),
    },
    {
      key: 'course',
      header: t('admin.colCourse'),
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground',
      render: (r) => <span className="truncate">{r.course.title}</span>,
    },
    {
      key: 'rating',
      header: t('admin.colRating'),
      sortable: true,
      render: (r) => <Stars value={r.rating} />,
    },
    {
      key: 'reportCount',
      header: t('admin.reportsLabel'),
      sortable: true,
      align: 'right',
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell tabular-nums',
      render: (r) =>
        r.reportCount > 0 ? <Badge variant="warning">{r.reportCount}</Badge> : <span className="text-muted-foreground">0</span>,
    },
    {
      key: 'createdAt',
      header: t('admin.colDate'),
      sortable: true,
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap',
      render: (r) => formatDate(r.createdAt, locale),
    },
    {
      key: 'status',
      header: t('admin.colStatus'),
      render: (r) =>
        r.hiddenAt ? (
          <Badge variant="muted">{t('admin.hiddenLabel')}</Badge>
        ) : (
          <Badge variant="success">{t('admin.visibleLabel')}</Badge>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      {stats && (
        <StatCardGrid>
          <StatCard label={t('admin.total')} value={stats.total} icon="ChatBubbleLeftRightIcon" iconColor="text-foreground" />
          <StatCard label={t('admin.visibleLabel')} value={stats.visible} icon="EyeIcon" iconColor="text-success" />
          <StatCard label={t('admin.hiddenLabel')} value={stats.hidden} icon="EyeSlashIcon" iconColor="text-muted-foreground" />
          <StatCard label={t('admin.reported')} value={stats.reported} icon="FlagIcon" iconColor="text-destructive" />
        </StatCardGrid>
      )}

      <Toolbar>
        <div className="flex flex-wrap items-center gap-3">
          <div className="overflow-x-auto -mx-1 px-1">
            <FilterChips options={FILTERS} value={status} onChange={resetTo(setStatus)} className="flex-nowrap" />
          </div>
          <select
            value={rating}
            onChange={(e) => resetTo(setRating)(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="h-9 px-3 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-card text-foreground"
          >
            <option value="all">{t('admin.allRating')}</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} ★</option>
            ))}
          </select>
        </div>
        <SearchInput placeholder={t('admin.searchReviewPlaceholder')} onSearch={resetTo(setSearch)} />
      </Toolbar>

      <BulkActionBar
        count={selectedIds.size}
        label={(c) => `${c} ${t('admin.bulkSelected')}`}
        onClear={() => setSelectedIds(new Set())}
        isLoading={mutation.isPending}
        actions={[
          { label: t('admin.bulkHide'), icon: 'EyeSlashIcon', variant: 'outline', onClick: () => setBulkReason({ open: true, text: '' }) },
          { label: t('admin.unhideBtn'), icon: 'EyeIcon', variant: 'outline', onClick: () => runBulk('unhide') },
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
        rows={reviews}
        getRowId={(r) => r.id}
        onRowClick={openDrawer}
        sort={sort}
        onSortChange={handleSort}
        isLoading={isLoading}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        emptyIcon="ChatBubbleLeftRightIcon"
        emptyTitle={t('admin.reviewsNotFound')}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={resetTo(setPageSize)}
        isFetching={isFetching}
      />

      <Drawer
        open={active !== null}
        onClose={() => setActive(null)}
        title={active?.student.fullName}
        subtitle={active?.course.title}
        width="lg"
        footer={
          active ? (
            drawerAction ? (
              <>
                <Button variant="ghost" onClick={() => setDrawerAction(null)}>{t('common.cancel')}</Button>
                <Button
                  variant="destructive"
                  loading={mutation.isPending}
                  onClick={() => {
                    if (reason.trim().length < 5) return toast.error(t('admin.noteRequired'));
                    runSingle(active, drawerAction, reason.trim());
                  }}
                >
                  {drawerAction === 'delete' ? t('admin.deleteBtn') : t('admin.hideBtn')}
                </Button>
              </>
            ) : (
              <>
                {active.hiddenAt ? (
                  <Button variant="outline" iconLeft="EyeIcon" loading={mutation.isPending} onClick={() => runSingle(active, 'unhide')}>
                    {t('admin.unhideBtn')}
                  </Button>
                ) : (
                  <Button variant="outline" iconLeft="EyeSlashIcon" onClick={() => { setDrawerAction('hide'); setReason(''); }}>
                    {t('admin.hideBtn')}
                  </Button>
                )}
                <Button variant="destructive" iconLeft="TrashIcon" onClick={() => { setDrawerAction('delete'); setReason(''); }}>
                  {t('admin.deleteBtn')}
                </Button>
              </>
            )
          ) : null
        }
      >
        {active && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <Stars value={active.rating} />
              <span className="text-xs text-muted-foreground">{formatDate(active.createdAt, locale)}</span>
            </div>
            <p className="text-foreground whitespace-pre-wrap break-words">{active.comment || '—'}</p>
            {active.hiddenAt && active.hideReason && (
              <div className="p-3 bg-muted/50 rounded-md border-l-2 border-primary text-muted-foreground">
                <strong>{t('admin.hideReason')}:</strong> {active.hideReason}
              </div>
            )}
            {drawerAction && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.reasonLabel')}</label>
                <textarea
                  autoFocus
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-card"
                  placeholder={t('admin.reasonPlaceholder')}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>

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
                runBulk('hide', bulkReason.text.trim());
              }}
            >
              {t('admin.bulkHide')}
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
          placeholder={t('admin.reasonPlaceholder')}
        />
      </Modal>
    </div>
  );
};

export default ReviewsPanel;
