'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useAdminCourses,
  type AdminCourseDTO,
  type ModerationStatusDTO,
} from '@/hooks/queries/useAdminCourses';
import { useCourseActionMutation } from '@/hooks/mutations/useCourseActionMutation';
import { useI18n } from '@/contexts/I18nContext';

type StatusFilter = ModerationStatusDTO | 'all';

const STATUS_TABS: { id: StatusFilter; label: string; color?: string }[] = [
  { id: 'all', label: 'Barchasi' },
  { id: 'submitted', label: 'Yuborilgan' },
  { id: 'under_review', label: "Ko'rib chiqilmoqda" },
  { id: 'approved', label: 'Tasdiqlangan' },
  { id: 'rejected', label: 'Rad etilgan' },
  { id: 'revision_requested', label: "O'zgartirish" },
  { id: 'draft', label: 'Qoralama' },
];

const STATUS_BADGE: Record<ModerationStatusDTO, { label: string; color: string }> = {
  draft: { label: 'statusDraft', color: 'bg-muted text-muted-foreground' },
  submitted: { label: 'statusSubmitted', color: 'bg-warning/10 text-warning' },
  under_review: { label: 'statusUnderReview', color: 'bg-secondary/10 text-secondary' },
  approved: { label: 'statusApproved', color: 'bg-success/10 text-success' },
  rejected: { label: 'statusRejected', color: 'bg-destructive/10 text-destructive' },
  revision_requested: {
    label: 'statusRevisionRequested',
    color: 'bg-primary/10 text-primary',
  },
};

type PendingAction =
  | { course: AdminCourseDTO; type: 'approve' }
  | { course: AdminCourseDTO; type: 'reject' }
  | { course: AdminCourseDTO; type: 'request_revision' }
  | { course: AdminCourseDTO; type: 'feature' }
  | { course: AdminCourseDTO; type: 'unfeature' }
  | { course: AdminCourseDTO; type: 'suspend' }
  | { course: AdminCourseDTO; type: 'unsuspend' };

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('uz-UZ');
}

function formatUzs(uzs: string): string {
  const n = Number(uzs);
  if (!Number.isFinite(n) || n === 0) return 'Free';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`;
  return `${(n / 1_000).toFixed(0)}K so'm`;
}

const CourseOversightPanel = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');

  // Debounce 300ms
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, error, refetch } = useAdminCourses({
    status,
    search: search || undefined,
    featuredOnly,
  });

  const actionMutation = useCourseActionMutation();

  const courses = data?.courses ?? [];
  const stats = data?.stats;

  // Reset feedback when modal opens
  useEffect(() => {
    if (pending) setFeedbackInput('');
  }, [pending]);

  const confirmInfo = useMemo(() => {
    if (!pending) return null;
    const t = pending.course.title;
    switch (pending.type) {
      case 'approve':
        return {
          title: t('admin.approveCourse'),
          message: `"${t}" kursini tasdiqlaysizmi? Marketplace'da darrov ko'rinadi.`,
          confirmLabel: t('admin.approve'),
          variant: 'default' as const,
          requireFeedback: false,
          feedbackLabel: t('admin.noteOptional'),
        };
      case 'reject':
        return {
          title: t('admin.rejectCourse'),
          message: `"${t}" kursini rad etyapsiz. Sabab ko'rsating (kamida 5 belgi).`,
          confirmLabel: t('admin.reject'),
          variant: 'danger' as const,
          requireFeedback: true,
          feedbackLabel: t('admin.rejectReasonLabel'),
        };
      case 'request_revision':
        return {
          title: t('admin.requestRevision'),
          message: `"${t}" kursi uchun teacher'ga aniq izoh yozing.`,
          confirmLabel: t('admin.sendRequest'),
          variant: 'default' as const,
          requireFeedback: true,
          feedbackLabel: t('admin.revisionNote'),
        };
      case 'feature':
        return {
          title: t('admin.markFeatured'),
          message: `"${t}" kursi marketplace'da yuqorida ko'rsatiladi.`,
          confirmLabel: t('admin.markFeaturedBtn'),
          variant: 'default' as const,
          requireFeedback: false,
          feedbackLabel: '',
        };
      case 'unfeature':
        return {
          title: t('admin.unmarkFeatured'),
          message: `"${t}" kursi oddiy ro'yxatga qaytadi.`,
          confirmLabel: t('admin.unmarkFeaturedBtn'),
          variant: 'default' as const,
          requireFeedback: false,
          feedbackLabel: '',
        };
      case 'suspend':
        return {
          title: t('admin.suspendCourse'),
          message: `"${t}" kursi yashiriladi. Sabab ko'rsating.`,
          confirmLabel: t('admin.suspendBtn'),
          variant: 'danger' as const,
          requireFeedback: true,
          feedbackLabel: t('admin.suspendReason'),
        };
      case 'unsuspend':
        return {
          title: t('admin.unsuspendCourse'),
          message: `"${t}" kursi qaytarib faollashtiriladi.`,
          confirmLabel: t('admin.unsuspendBtn'),
          variant: 'default' as const,
          requireFeedback: false,
          feedbackLabel: '',
        };
    }
  }, [pending]);

  const handleConfirm = () => {
    if (!pending || !confirmInfo) return;
    const onSuccess = (msg: string) => {
      toast.success(msg);
      setPending(null);
    };
    const onError = (err: Error) => {
      toast.error(err.message);
    };

    const { course, type } = pending;
    switch (type) {
      case 'approve':
        actionMutation.mutate(
          { courseId: course.id, action: 'approve', feedback: feedbackInput || undefined },
          { onSuccess: () => onSuccess(t('admin.courseApproved')), onError },
        );
        break;
      case 'reject':
        actionMutation.mutate(
          { courseId: course.id, action: 'reject', feedback: feedbackInput },
          { onSuccess: () => onSuccess(t('admin.courseRejected')), onError },
        );
        break;
      case 'request_revision':
        actionMutation.mutate(
          { courseId: course.id, action: 'request_revision', feedback: feedbackInput },
          { onSuccess: () => onSuccess(t('admin.revisionSent')), onError },
        );
        break;
      case 'feature':
        actionMutation.mutate(
          { courseId: course.id, action: 'feature' },
          { onSuccess: () => onSuccess(t('admin.markedFeatured')), onError },
        );
        break;
      case 'unfeature':
        actionMutation.mutate(
          { courseId: course.id, action: 'unfeature' },
          { onSuccess: () => onSuccess(t('admin.unmarkedFeatured')), onError },
        );
        break;
      case 'suspend':
        actionMutation.mutate(
          { courseId: course.id, action: 'suspend', reason: feedbackInput },
          { onSuccess: () => onSuccess(t('admin.courseSuspended')), onError },
        );
        break;
      case 'unsuspend':
        actionMutation.mutate(
          { courseId: course.id, action: 'unsuspend' },
          { onSuccess: () => onSuccess(t('admin.courseUnsuspended')), onError },
        );
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label={t('admin.total')} value={stats.total} icon="BookOpenIcon" color="text-foreground" />
          <StatCard label={t('admin.statusApproved')} value={stats.approved} icon="CheckCircleIcon" color="text-success" />
          <StatCard label={t('admin.waiting')} value={stats.submitted + stats.under_review} icon="ClockIcon" color="text-warning" />
          <StatCard label={t('admin.featured')} value={stats.featured} icon="StarIcon" color="text-primary" />
        </div>
      )}

      {/* Filter tabs */}
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
                {t(`admin.${tab.id === 'all' ? 'filterAll' : tab.id === 'submitted' ? 'statusSubmitted' : tab.id === 'under_review' ? 'statusUnderReview' : tab.id === 'approved' ? 'statusApproved' : tab.id === 'rejected' ? 'statusRejected' : tab.id === 'revision_requested' ? 'statusRevisionReq' : 'statusDraft'}`)}
                {tab.id !== 'all' && stats && stats[tab.id as keyof typeof stats] > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    {stats[tab.id as keyof typeof stats]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm whitespace-nowrap cursor-pointer">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <Icon name="StarIcon" size={16} className="text-primary" />
              Featured
            </label>

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
                placeholder={t('admin.searchCourse')}
                className="pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Courses list */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            {t('admin.coursesCount')} ({data?.total ?? 0})
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
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="BookOpenIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('admin.coursesNotFound')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => {
              const badge = STATUS_BADGE[course.moderationStatus];
              const menuOpen = openMenuFor === course.id;
              const isSuspended = course.suspendedAt !== null;
              return (
                <div
                  key={course.id}
                  className="flex items-start justify-between gap-3 p-4 border border-border rounded-md hover:bg-muted/30 transition-smooth"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-md shrink-0">
                      <Icon name="BookOpenIcon" size={24} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-heading font-semibold text-foreground truncate">
                          {course.title}
                        </h4>
                        {course.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                            <Icon name="StarIcon" size={12} variant="solid" />
                            Featured
                          </span>
                        )}
                        {isSuspended && (
                          <span className="px-2 py-0.5 bg-destructive/10 text-destructive text-xs rounded-full">
                            {t('admin.suspended')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {course.teacher.fullName} · {course.categoryRel?.name ?? t('admin.noCategory')}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span>📚 {course._count.topics} mavzu</span>
                        <span>👥 {course._count.enrollments} talaba</span>
                        <span>⭐ {Number(course.rating).toFixed(1)} ({course._count.reviews})</span>
                        <span>💰 {formatUzs(course.priceUzs)}</span>
                        <span>📅 {formatDate(course.createdAt)}</span>
                      </div>
                      {course.adminFeedback && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground border-l-2 border-primary">
                          <strong>{t('admin.adminNote')}:</strong> {course.adminFeedback}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badge.color}`}>
                      {t(`admin.${badge.label}`)}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuFor(menuOpen ? null : course.id)}
                        className="p-2 hover:bg-muted rounded-md transition-smooth"
                        aria-label="Amallar"
                      >
                        <Icon name="EllipsisVerticalIcon" size={20} className="text-muted-foreground" />
                      </button>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuFor(null)} />
                          <div className="absolute right-0 mt-1 w-56 bg-card border border-border rounded-md shadow-warm-lg z-20 py-1">
                            {course.moderationStatus !== 'approved' && (
                              <MenuItem
                                icon="CheckCircleIcon"
                                label={t('admin.approve')}
                                color="text-success"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ course, type: 'approve' });
                                }}
                              />
                            )}
                            {course.moderationStatus !== 'rejected' && (
                              <MenuItem
                                icon="XCircleIcon"
                                label={t('admin.reject')}
                                color="text-destructive"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ course, type: 'reject' });
                                }}
                              />
                            )}
                            <MenuItem
                              icon="ArrowPathIcon"
                              label={t('admin.requestRevisionMenu')}
                              onClick={() => {
                                setOpenMenuFor(null);
                                setPending({ course, type: 'request_revision' });
                              }}
                            />
                            <div className="border-t border-border my-1" />
                            {course.isFeatured ? (
                              <MenuItem
                                icon="StarIcon"
                                label={t('admin.removeFeaturedMenu')}
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ course, type: 'unfeature' });
                                }}
                              />
                            ) : (
                              <MenuItem
                                icon="StarIcon"
                                label={t('admin.featureBtnLabel')}
                                color="text-primary"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ course, type: 'feature' });
                                }}
                              />
                            )}
                            <div className="border-t border-border my-1" />
                            {isSuspended ? (
                              <MenuItem
                                icon="PlayCircleIcon"
                                label={t('admin.unsuspendBtn')}
                                color="text-success"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ course, type: 'unsuspend' });
                                }}
                              />
                            ) : (
                              <MenuItem
                                icon="NoSymbolIcon"
                                label={t('admin.tempSuspend')}
                                color="text-destructive"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  setPending({ course, type: 'suspend' });
                                }}
                              />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm modal (textarea inside) */}
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
        (confirmInfo.requireFeedback ||
          pending.type === 'approve') && (
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

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-md shadow-warm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon name={icon} size={18} className={color} />
      </div>
      <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  color = 'text-foreground',
  onClick,
}: {
  icon: string;
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2 ${color}`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

// Bu textarea ConfirmModal'ning ichida emas, alohida overlay sifatida
// ko'rsatiladi (z-index: modal'dan yuqori).
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
    <div className="fixed left-1/2 -translate-x-1/2 z-[210] w-full max-w-md pointer-events-none"
         style={{ bottom: '30%' }}>
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
