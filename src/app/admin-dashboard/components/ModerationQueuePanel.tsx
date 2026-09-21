'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
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
  useAdminModeration,
  type ModerationQueueItemDTO,
  type ModerationStatusDTO,
} from '@/hooks/queries/useAdminModeration';
import { useModerateMaterialMutation } from '@/hooks/mutations/useModerateMaterialMutation';
import { useI18n } from '@/contexts/I18nContext';
import { formatDateTime as fmtDateTime } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

interface ModerationQueuePanelProps {
  expanded?: boolean;
}

type StatusFilter = ModerationStatusDTO | 'all';

const STATUS_VARIANT: Record<ModerationStatusDTO, BadgeVariant> = {
  draft: 'muted',
  submitted: 'warning',
  under_review: 'secondary',
  approved: 'success',
  rejected: 'destructive',
  revision_requested: 'primary',
};
const STATUS_LABEL_KEY: Record<ModerationStatusDTO, string> = {
  draft: 'admin.statusDraft',
  submitted: 'admin.statusNew',
  under_review: 'admin.statusUnderReview',
  approved: 'admin.statusApproved',
  rejected: 'admin.statusRejected',
  revision_requested: 'admin.modRevisionReq',
};
const CONTENT_TYPE_ICON: Record<string, string> = {
  document: 'DocumentTextIcon',
  video: 'VideoCameraIcon',
  audio: 'MusicalNoteIcon',
  external_link: 'LinkIcon',
};

function formatMinutes(mins: number): string {
  if (!mins || mins <= 0) return '—';
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = Math.round(mins % 60);
  if (d > 0) return h > 0 ? `${d} kun ${h} soat` : `${d} kun`;
  if (h > 0) return m > 0 ? `${h} soat ${m} daq` : `${h} soat`;
  return `${m} daq`;
}
function formatDateTime(iso: string | null, locale: Locale): string {
  if (!iso) return '—';
  return fmtDateTime(iso, locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const isActionable = (s: ModerationStatusDTO) => s === 'submitted' || s === 'under_review';

const ModerationQueuePanel = ({ expanded = false }: ModerationQueuePanelProps) => {
  const { t, locale } = useI18n();
  const [status, setStatus] = useState<StatusFilter>('submitted');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<SortState>({ key: 'submittedAt', dir: 'desc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<ModerationQueueItemDTO | null>(null);
  const [drawerAction, setDrawerAction] = useState<'reject' | 'request_revision' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [bulkReason, setBulkReason] = useState<{ open: boolean; text: string }>({ open: false, text: '' });

  const { data, isLoading, isFetching, error, refetch } = useAdminModeration({
    status,
    search: search || undefined,
    page: expanded ? page : 1,
    pageSize: expanded ? pageSize : 5,
    sort: 'submittedAt',
    order: sort.dir,
  });
  const mutation = useModerateMaterialMutation();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const stats = data?.stats;

  // ─── Overview compact mode (expanded=false) ──────────────────────────────
  if (!expanded) {
    return (
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-heading font-semibold text-foreground">{t('admin.moderationQueue')}</h3>
          {stats && stats.submitted > 0 && (
            <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">
              {stats.submitted} {t('admin.newItems')}
            </span>
          )}
        </div>
        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="p-3 bg-warning/10 rounded-md">
              <p className="text-xs text-muted-foreground">{t('admin.waitingMod')}</p>
              <p className="text-xl font-heading font-bold text-warning">{stats.submitted}</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-md">
              <p className="text-xs text-muted-foreground">{t('admin.reviewingMod')}</p>
              <p className="text-xl font-heading font-bold text-secondary">{stats.under_review}</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">{t('admin.averageMod')}</p>
              <p className="text-xl font-heading font-bold text-foreground">{formatMinutes(stats.avgReviewMinutes)}</p>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="animate-pulse h-12 bg-muted rounded-md" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <Icon name="CheckCircleIcon" size={32} className="text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('admin.queueEmpty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-muted/40 rounded-md transition-smooth">
                <Icon name={CONTENT_TYPE_ICON[item.material.contentType ?? ''] ?? 'DocumentIcon'} size={18} className="text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{item.material.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.material.teacher.fullName}</p>
                </div>
                <Badge variant={STATUS_VARIANT[item.status]}>{t(STATUS_LABEL_KEY[item.status])}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Expanded CRM mode (moderation tab) ──────────────────────────────────
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

  const runSingle = async (
    item: ModerationQueueItemDTO,
    action: 'start_review' | 'approve' | 'reject' | 'request_revision',
    fb?: string,
  ) => {
    try {
      if (action === 'reject') {
        await mutation.mutateAsync({ queueId: item.id, action: 'reject', feedback: fb! });
        toast.success(t('admin.materialRejected'));
      } else if (action === 'request_revision') {
        await mutation.mutateAsync({ queueId: item.id, action: 'request_revision', feedback: fb! });
        toast.success(t('admin.revisionSentMod'));
      } else if (action === 'approve') {
        await mutation.mutateAsync({ queueId: item.id, action: 'approve' });
        toast.success(t('admin.materialApproved'));
      } else {
        await mutation.mutateAsync({ queueId: item.id, action: 'start_review' });
        toast.success(t('admin.reviewStartedMod'));
      }
      setActive(null);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const runBulk = async (action: 'approve' | 'reject', fb?: string) => {
    const targets = items.filter((i) => selectedIds.has(i.id) && isActionable(i.status));
    if (targets.length === 0) return;
    const results = await Promise.allSettled(
      targets.map((i) =>
        action === 'reject'
          ? mutation.mutateAsync({ queueId: i.id, action: 'reject', feedback: fb! })
          : mutation.mutateAsync({ queueId: i.id, action: 'approve' }),
      ),
    );
    const ok = results.filter((r) => r.status === 'fulfilled').length;
    const fail = results.length - ok;
    toast.success(`${ok} ${t('admin.bulkSelected')}${fail ? ` · ${fail} ✕` : ''}`);
    setSelectedIds(new Set());
    setBulkReason({ open: false, text: '' });
  };

  const FILTERS: { id: StatusFilter; label: string; count?: number }[] = [
    { id: 'submitted', label: t('admin.statusNew'), count: stats?.submitted },
    { id: 'under_review', label: t('admin.statusUnderReview'), count: stats?.under_review },
    { id: 'revision_requested', label: t('admin.modRevisionReq'), count: stats?.revision_requested },
    { id: 'approved', label: t('admin.statusApproved'), count: stats?.approved },
    { id: 'rejected', label: t('admin.statusRejected'), count: stats?.rejected },
    { id: 'all', label: t('admin.statusAll') },
  ];

  const columns: Column<ModerationQueueItemDTO>[] = [
    {
      key: 'title',
      header: t('admin.materialLabel'),
      render: (it) => (
        <div className="flex items-center gap-3 min-w-0">
          <Icon name={CONTENT_TYPE_ICON[it.material.contentType ?? ''] ?? 'DocumentIcon'} size={18} className="text-primary shrink-0" />
          <span className="font-medium text-foreground truncate">{it.material.title}</span>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: t('admin.colTeacher'),
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground',
      render: (it) => <span className="truncate">{it.material.teacher.fullName}</span>,
    },
    {
      key: 'course',
      header: t('admin.colCourse'),
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground',
      render: (it) => <span className="truncate">{it.material.course?.title ?? '—'}</span>,
    },
    {
      key: 'status',
      header: t('admin.colStatus'),
      render: (it) => <Badge variant={STATUS_VARIANT[it.status]}>{t(STATUS_LABEL_KEY[it.status])}</Badge>,
    },
    {
      key: 'submittedAt',
      header: t('admin.colCreated'),
      sortable: true,
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell text-muted-foreground whitespace-nowrap',
      render: (it) => formatDateTime(it.submittedAt, locale),
    },
  ];

  const sourceUrl = active?.material.fileUrl || active?.material.externalLink || null;

  return (
    <div className="space-y-4">
      {stats && (
        <StatCardGrid className="lg:grid-cols-5">
          <StatCard label={t('admin.statusNew')} value={stats.submitted} icon="ClockIcon" iconColor="text-warning" />
          <StatCard label={t('admin.reviewingMod')} value={stats.under_review} icon="EyeIcon" iconColor="text-secondary" />
          <StatCard label={t('admin.modRevisionReq')} value={stats.revision_requested} icon="ArrowPathIcon" iconColor="text-primary" />
          <StatCard label={t('admin.statusApproved')} value={stats.approved} icon="CheckCircleIcon" iconColor="text-success" />
          <StatCard label={t('admin.statusRejected')} value={stats.rejected} icon="XCircleIcon" iconColor="text-destructive" />
        </StatCardGrid>
      )}

      <Toolbar>
        <div className="overflow-x-auto -mx-1 px-1">
          <FilterChips options={FILTERS} value={status} onChange={resetTo(setStatus)} className="flex-nowrap" />
        </div>
        <SearchInput placeholder={t('admin.searchTicketPlaceholder')} onSearch={resetTo(setSearch)} />
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
        rows={items}
        getRowId={(it) => it.id}
        onRowClick={(it) => { setActive(it); setDrawerAction(null); setFeedback(''); }}
        sort={sort}
        onSortChange={handleSort}
        isLoading={isLoading}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        emptyIcon="CheckCircleIcon"
        emptyTitle={t('admin.moderationNotFound')}
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
        title={active?.material.title}
        subtitle={active ? t(STATUS_LABEL_KEY[active.status]) : undefined}
        width="lg"
        footer={
          active && isActionable(active.status) ? (
            drawerAction ? (
              <>
                <Button variant="ghost" onClick={() => setDrawerAction(null)}>{t('common.cancel')}</Button>
                <Button
                  variant={drawerAction === 'reject' ? 'destructive' : 'primary'}
                  loading={mutation.isPending}
                  onClick={() => {
                    if (feedback.trim().length < 5) return toast.error(t('admin.noteRequired'));
                    runSingle(active, drawerAction, feedback.trim());
                  }}
                >
                  {drawerAction === 'reject' ? t('admin.rejectBtn') : t('admin.sendRequest')}
                </Button>
              </>
            ) : (
              <>
                {active.status === 'submitted' && (
                  <Button variant="ghost" iconLeft="EyeIcon" loading={mutation.isPending} onClick={() => runSingle(active, 'start_review')}>
                    {t('admin.startBtn')}
                  </Button>
                )}
                <Button variant="outline" iconLeft="ArrowPathIcon" onClick={() => { setDrawerAction('request_revision'); setFeedback(''); }}>
                  {t('admin.revisionBtn')}
                </Button>
                <Button variant="outline" iconLeft="XCircleIcon" className="text-destructive" onClick={() => { setDrawerAction('reject'); setFeedback(''); }}>
                  {t('admin.rejectBtn')}
                </Button>
                <Button variant="primary" iconLeft="CheckCircleIcon" loading={mutation.isPending} onClick={() => runSingle(active, 'approve')}>
                  {t('admin.approveBtn')}
                </Button>
              </>
            )
          ) : null
        }
      >
        {active && (
          <div className="space-y-4 text-sm">
            <div className="text-muted-foreground">
              {active.material.teacher.fullName}
              {active.material.course ? ` · ${active.material.course.title}` : ''}
            </div>
            {active.material.description && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/70 mb-1">{t('admin.descriptionSection')}</p>
                <p className="text-foreground whitespace-pre-wrap break-words">{active.material.description}</p>
              </div>
            )}
            {sourceUrl && (
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-primary underline break-all">
                <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                {t('admin.openMaterial')}
              </a>
            )}
            {(active.plagiarismScore || active.qualityScore) && (
              <div className="flex gap-2">
                {active.plagiarismScore && <Badge variant="warning">Plagiat: {active.plagiarismScore}</Badge>}
                {active.qualityScore && <Badge variant="secondary">Sifat: {active.qualityScore}</Badge>}
              </div>
            )}
            {active.feedback && (
              <div className="p-3 bg-muted/50 rounded-md border-l-2 border-primary text-muted-foreground">
                <strong>{t('admin.previousNote')}:</strong> {active.feedback}
              </div>
            )}
            {drawerAction && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t('admin.feedbackLabel')}</label>
                <textarea
                  autoFocus
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="w-full p-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none bg-card"
                  placeholder={t('admin.writePlaceholder')}
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

export default ModerationQueuePanel;
