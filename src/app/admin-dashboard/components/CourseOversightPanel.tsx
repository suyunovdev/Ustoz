'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import Badge, { type BadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard, StatCardGrid } from '@/components/ui/StatCard';
import { DataTable, type Column, type SortState } from '@/components/ui/DataTable';
import { Menu, type MenuItem } from '@/components/ui/Menu';
import { Pagination } from '@/components/ui/Pagination';
import { Toolbar, SearchInput, FilterChips } from '@/components/ui/Toolbar';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useAdminCourses,
  type AdminCourseDTO,
  type AdminCoursesSortField,
  type ModerationStatusDTO,
} from '@/hooks/queries/useAdminCourses';
import { useCourseActionMutation } from '@/hooks/mutations/useCourseActionMutation';
import { useI18n } from '@/contexts/I18nContext';
import { type Locale } from '@/lib/i18n';
import { formatDate } from '@/lib/i18n/format';
import { getSubjectLabel } from '@/lib/data/subject-labels';

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
  submitted: 'admin.statusSubmitted',
  under_review: 'admin.statusUnderReview',
  approved: 'admin.statusApproved',
  rejected: 'admin.statusRejected',
  revision_requested: 'admin.statusRevisionReq',
};

type PendingAction =
  | { course: AdminCourseDTO; type: 'approve' }
  | { course: AdminCourseDTO; type: 'reject' }
  | { course: AdminCourseDTO; type: 'request_revision' }
  | { course: AdminCourseDTO; type: 'feature' }
  | { course: AdminCourseDTO; type: 'unfeature' }
  | { course: AdminCourseDTO; type: 'suspend' }
  | { course: AdminCourseDTO; type: 'unsuspend' };

function fmtDate(iso: string | null, locale: Locale): string {
  if (!iso) return '—';
  return formatDate(iso, locale);
}

function formatUzs(uzs: string): string {
  const n = Number(uzs);
  if (!Number.isFinite(n) || n === 0) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`;
  return `${(n / 1_000).toFixed(0)}K so'm`;
}

const CourseOversightPanel = () => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<SortState>({ key: 'createdAt', dir: 'desc' });
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');

  const { data, isLoading, isFetching, error, refetch } = useAdminCourses({
    status,
    search: search || undefined,
    featuredOnly,
    page,
    pageSize,
    sort: sort.key as AdminCoursesSortField,
    order: sort.dir,
  });

  const actionMutation = useCourseActionMutation();

  const courses = data?.courses ?? [];
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
    if (pending) setFeedbackInput('');
  }, [pending]);

  const STATUS_FILTERS = useMemo(() => {
    const base: { id: StatusFilter; label: string; count?: number }[] = [
      { id: 'all', label: t('admin.filterAll') },
      { id: 'submitted', label: t('admin.statusSubmitted'), count: stats?.submitted },
      { id: 'under_review', label: t('admin.statusUnderReview'), count: stats?.under_review },
      { id: 'approved', label: t('admin.statusApproved'), count: stats?.approved },
      { id: 'rejected', label: t('admin.statusRejected'), count: stats?.rejected },
      { id: 'revision_requested', label: t('admin.statusRevisionReq'), count: stats?.revision_requested },
      { id: 'draft', label: t('admin.statusDraft'), count: stats?.draft },
    ];
    return base;
  }, [t, stats]);

  const confirmInfo = useMemo(() => {
    if (!pending) return null;
    const courseTitle = pending.course.title;
    switch (pending.type) {
      case 'approve':
        return { title: t('admin.approveCourse'), message: `"${courseTitle}" kursini tasdiqlaysizmi? Marketplace'da darrov ko'rinadi.`, confirmLabel: t('admin.approve'), variant: 'default' as const, requireFeedback: false, feedbackLabel: t('admin.noteOptional') };
      case 'reject':
        return { title: t('admin.rejectCourse'), message: `"${courseTitle}" kursini rad etyapsiz. Sabab ko'rsating (kamida 5 belgi).`, confirmLabel: t('admin.reject'), variant: 'danger' as const, requireFeedback: true, feedbackLabel: t('admin.rejectReasonLabel') };
      case 'request_revision':
        return { title: t('admin.requestRevision'), message: `"${courseTitle}" kursi uchun teacher'ga aniq izoh yozing.`, confirmLabel: t('admin.sendRequest'), variant: 'default' as const, requireFeedback: true, feedbackLabel: t('admin.revisionNote') };
      case 'feature':
        return { title: t('admin.markFeatured'), message: `"${courseTitle}" kursi marketplace'da yuqorida ko'rsatiladi.`, confirmLabel: t('admin.markFeaturedBtn'), variant: 'default' as const, requireFeedback: false, feedbackLabel: '' };
      case 'unfeature':
        return { title: t('admin.unmarkFeatured'), message: `"${courseTitle}" kursi oddiy ro'yxatga qaytadi.`, confirmLabel: t('admin.unmarkFeaturedBtn'), variant: 'default' as const, requireFeedback: false, feedbackLabel: '' };
      case 'suspend':
        return { title: t('admin.suspendCourse'), message: `"${courseTitle}" kursi yashiriladi. Sabab ko'rsating.`, confirmLabel: t('admin.suspendBtn'), variant: 'danger' as const, requireFeedback: true, feedbackLabel: t('admin.suspendReason') };
      case 'unsuspend':
        return { title: t('admin.unsuspendCourse'), message: `"${courseTitle}" kursi qaytarib faollashtiriladi.`, confirmLabel: t('admin.unsuspendBtn'), variant: 'default' as const, requireFeedback: false, feedbackLabel: '' };
    }
  }, [pending, t]);

  const handleConfirm = () => {
    if (!pending || !confirmInfo) return;
    const onSuccess = (msg: string) => {
      toast.success(msg);
      setPending(null);
    };
    const onError = (err: Error) => toast.error(err.message);

    const { course, type } = pending;
    switch (type) {
      case 'approve':
        actionMutation.mutate({ courseId: course.id, action: 'approve', feedback: feedbackInput || undefined }, { onSuccess: () => onSuccess(t('admin.courseApproved')), onError });
        break;
      case 'reject':
        actionMutation.mutate({ courseId: course.id, action: 'reject', feedback: feedbackInput }, { onSuccess: () => onSuccess(t('admin.courseRejected')), onError });
        break;
      case 'request_revision':
        actionMutation.mutate({ courseId: course.id, action: 'request_revision', feedback: feedbackInput }, { onSuccess: () => onSuccess(t('admin.revisionSent')), onError });
        break;
      case 'feature':
        actionMutation.mutate({ courseId: course.id, action: 'feature' }, { onSuccess: () => onSuccess(t('admin.markedFeatured')), onError });
        break;
      case 'unfeature':
        actionMutation.mutate({ courseId: course.id, action: 'unfeature' }, { onSuccess: () => onSuccess(t('admin.unmarkedFeatured')), onError });
        break;
      case 'suspend':
        actionMutation.mutate({ courseId: course.id, action: 'suspend', reason: feedbackInput }, { onSuccess: () => onSuccess(t('admin.courseSuspended')), onError });
        break;
      case 'unsuspend':
        actionMutation.mutate({ courseId: course.id, action: 'unsuspend' }, { onSuccess: () => onSuccess(t('admin.courseUnsuspended')), onError });
        break;
    }
  };

  const buildMenu = (course: AdminCourseDTO): MenuItem[][] => {
    const isSuspended = course.suspendedAt !== null;
    const moderation: MenuItem[] = [];
    if (course.moderationStatus !== 'approved') {
      moderation.push({ label: t('admin.approve'), icon: 'CheckCircleIcon', variant: 'success', onClick: () => setPending({ course, type: 'approve' }) });
    }
    if (course.moderationStatus !== 'rejected') {
      moderation.push({ label: t('admin.reject'), icon: 'XCircleIcon', variant: 'danger', onClick: () => setPending({ course, type: 'reject' }) });
    }
    moderation.push({ label: t('admin.requestRevisionMenu'), icon: 'ArrowPathIcon', onClick: () => setPending({ course, type: 'request_revision' }) });

    const feature: MenuItem[] = [
      course.isFeatured
        ? { label: t('admin.removeFeaturedMenu'), icon: 'StarIcon', onClick: () => setPending({ course, type: 'unfeature' }) }
        : { label: t('admin.featureBtnLabel'), icon: 'StarIcon', onClick: () => setPending({ course, type: 'feature' }) },
    ];

    const suspend: MenuItem[] = [
      isSuspended
        ? { label: t('admin.unsuspendBtn'), icon: 'PlayCircleIcon', variant: 'success', onClick: () => setPending({ course, type: 'unsuspend' }) }
        : { label: t('admin.tempSuspend'), icon: 'NoSymbolIcon', variant: 'danger', onClick: () => setPending({ course, type: 'suspend' }) },
    ];

    return [moderation, feature, suspend];
  };

  const columns: Column<AdminCourseDTO>[] = [
    {
      key: 'title',
      header: t('admin.colCourse'),
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 bg-primary/10 rounded-md shrink-0">
            <Icon name="BookOpenIcon" size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground truncate">{c.title}</span>
              {c.isFeatured && <Badge variant="primary" icon="StarIcon">{t('admin.featured')}</Badge>}
              {c.suspendedAt && <Badge variant="destructive">{t('admin.suspended')}</Badge>}
            </div>
            <span className="text-xs text-muted-foreground truncate block">
              {c.categoryRel?.name ?? (c.subjectCategory ? getSubjectLabel(c.subjectCategory) : t('admin.noCategory'))}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'teacher',
      header: t('admin.colTeacher'),
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground',
      render: (c) => <span className="truncate">{c.teacher.fullName}</span>,
    },
    {
      key: 'priceUzs',
      header: t('admin.colPrice'),
      sortable: true,
      align: 'right',
      cellClassName: 'whitespace-nowrap',
      render: (c) =>
        Number(c.priceUzs) > 0 ? (
          <span className="text-foreground">{formatUzs(c.priceUzs)}</span>
        ) : (
          <span className="text-muted-foreground">{t('courses.free')}</span>
        ),
    },
    {
      key: 'enrollmentCount',
      header: t('admin.colStudents'),
      sortable: true,
      align: 'right',
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell tabular-nums',
      render: (c) => c._count.enrollments,
    },
    {
      key: 'rating',
      header: t('admin.colRating'),
      sortable: true,
      align: 'right',
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell whitespace-nowrap text-muted-foreground',
      render: (c) => `${Number(c.rating).toFixed(1)} (${c._count.reviews})`,
    },
    {
      key: 'moderationStatus',
      header: t('admin.colStatus'),
      render: (c) => (
        <Badge variant={STATUS_VARIANT[c.moderationStatus]}>
          {t(STATUS_LABEL_KEY[c.moderationStatus])}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('admin.colCreated'),
      sortable: true,
      headerClassName: 'hidden lg:table-cell',
      cellClassName: 'hidden lg:table-cell text-muted-foreground whitespace-nowrap',
      render: (c) => fmtDate(c.createdAt, locale),
    },
    {
      key: 'actions',
      header: t('admin.colActions'),
      align: 'right',
      width: 'w-16',
      render: (c) => (
        <Menu
          triggerLabel={t('admin.actionsMenu')}
          sections={buildMenu(c).map((items) => ({ items }))}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {stats && (
        <StatCardGrid>
          <StatCard label={t('admin.total')} value={stats.total} icon="BookOpenIcon" iconColor="text-foreground" />
          <StatCard label={t('admin.statusApproved')} value={stats.approved} icon="CheckCircleIcon" iconColor="text-success" />
          <StatCard label={t('admin.waiting')} value={stats.submitted + stats.under_review} icon="ClockIcon" iconColor="text-warning" />
          <StatCard label={t('admin.featured')} value={stats.featured} icon="StarIcon" iconColor="text-primary" />
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
        <Button
          variant={featuredOnly ? 'primary' : 'outline'}
          size="sm"
          iconLeft="StarIcon"
          onClick={() => resetTo(setFeaturedOnly)(!featuredOnly)}
        >
          {t('admin.featured')}
        </Button>
        <SearchInput placeholder={t('admin.searchCourse')} onSearch={resetTo(setSearch)} />
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
        rows={courses}
        getRowId={(c) => c.id}
        onRowClick={(c) => router.push(`/courses/${c.id}`)}
        sort={sort}
        onSortChange={handleSort}
        isLoading={isLoading}
        emptyIcon="BookOpenIcon"
        emptyTitle={t('admin.coursesNotFound')}
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={resetTo(setPageSize)}
        isFetching={isFetching}
      />

      {confirmInfo && pending && (
        <ConfirmModal
          open={true}
          title={confirmInfo.title}
          message={confirmInfo.message}
          confirmLabel={confirmInfo.confirmLabel}
          variant={confirmInfo.variant}
          isLoading={actionMutation.isPending}
          onConfirm={() => {
            if (confirmInfo.requireFeedback && feedbackInput.trim().length < 5) {
              toast.error(t('admin.noteRequired'));
              return;
            }
            handleConfirm();
          }}
          onCancel={() => !actionMutation.isPending && setPending(null)}
        />
      )}
      {confirmInfo &&
        pending &&
        (confirmInfo.requireFeedback || pending.type === 'approve') && (
          <FeedbackOverlay
            label={confirmInfo.feedbackLabel}
            value={feedbackInput}
            onChange={setFeedbackInput}
            visible={pending !== null}
          />
        )}
    </div>
  );
};

// Textarea ConfirmModal ustida alohida overlay sifatida (z-index modaldan yuqori).
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
          placeholder={t('admin.notePlaceholder')}
        />
      </div>
    </div>
  );
}

export default CourseOversightPanel;
