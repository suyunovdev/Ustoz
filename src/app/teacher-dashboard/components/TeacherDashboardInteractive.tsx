'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { type TeacherTabId } from './TeacherSidebar';
import MetricsCard from './MetricsCard';
import {
  useTeacherDashboard,
  type TeacherDashboardCourse,
  type ModerationStatusDTO,
} from '@/hooks/queries/useTeacherDashboard';
import {
  useArchiveCourseMutation,
  useUnarchiveCourseMutation,
  useDeleteCourseMutation,
  useDuplicateCourseMutation,
} from '@/hooks/mutations/useTeacherCourseMutations';

const VALID_TABS: ReadonlyArray<TeacherTabId> = [
  'overview',
  'courses',
  'students',
  'groups',
  'assignments',
  'tests',
  'analytics',
  'earnings',
  'reviews',
];

const TAB_TITLE_KEYS: Record<TeacherTabId, { titleKey: string; subtitleKey: string }> = {
  overview: { titleKey: 'teacher.tabOverviewTitle', subtitleKey: 'teacher.tabOverviewSubtitle' },
  courses: { titleKey: 'teacher.tabCoursesTitle', subtitleKey: 'teacher.tabCoursesSubtitle' },
  students: { titleKey: 'teacher.tabStudentsTitle', subtitleKey: 'teacher.tabStudentsSubtitle' },
  groups: { titleKey: 'teacher.tabGroupsTitle', subtitleKey: 'teacher.tabGroupsSubtitle' },
  assignments: { titleKey: 'teacher.tabAssignmentsTitle', subtitleKey: 'teacher.tabAssignmentsSubtitle' },
  tests: { titleKey: 'teacher.tabTestsTitle', subtitleKey: 'teacher.tabTestsSubtitle' },
  analytics: { titleKey: 'teacher.tabAnalyticsTitle', subtitleKey: 'teacher.tabAnalyticsSubtitle' },
  earnings: { titleKey: 'teacher.tabEarningsTitle', subtitleKey: 'teacher.tabEarningsSubtitle' },
  reviews: { titleKey: 'teacher.tabReviewsTitle', subtitleKey: 'teacher.tabReviewsSubtitle' },
  certificates: { titleKey: 'teacher.tabCertificatesTitle', subtitleKey: 'teacher.tabCertificatesSubtitle' },
  messages: { titleKey: 'teacher.tabMessagesTitle', subtitleKey: 'teacher.tabMessagesSubtitle' },
};

const STATUS_BADGE_KEYS: Record<ModerationStatusDTO, { labelKey: string; color: string }> = {
  draft: { labelKey: 'teacher.statusDraft', color: 'bg-muted text-muted-foreground' },
  submitted: { labelKey: 'teacher.statusSubmitted', color: 'bg-warning/10 text-warning' },
  under_review: { labelKey: 'teacher.statusUnderReview', color: 'bg-secondary/10 text-secondary' },
  approved: { labelKey: 'teacher.statusApproved', color: 'bg-success/10 text-success' },
  rejected: { labelKey: 'teacher.statusRejected', color: 'bg-destructive/10 text-destructive' },
  revision_requested: {
    labelKey: 'teacher.statusRevisionRequested',
    color: 'bg-primary/10 text-primary',
  },
};

function formatUzs(uzs: string | number): string {
  const n = typeof uzs === 'string' ? Number(uzs) : uzs;
  if (!Number.isFinite(n) || n === 0) return "0 so'm";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M so'm`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K so'm`;
  return `${n.toLocaleString('uz-UZ')} so'm`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ');
}

type PendingAction =
  | { type: 'archive'; course: TeacherDashboardCourse }
  | { type: 'unarchive'; course: TeacherDashboardCourse }
  | { type: 'delete'; course: TeacherDashboardCourse }
  | { type: 'duplicate'; course: TeacherDashboardCourse };

const TeacherDashboardInteractive = () => {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams?.get('tab');
  const initialTab: TeacherTabId = VALID_TABS.includes(tabFromUrl as TeacherTabId)
    ? (tabFromUrl as TeacherTabId)
    : 'overview';

  const [activeTab, setActiveTab] = useState<TeacherTabId>(initialTab);
  const [pending, setPending] = useState<PendingAction | null>(null);

  // URL ?tab=... o'zgarganda activeTab'ni yangilash
  useEffect(() => {
    if (VALID_TABS.includes(tabFromUrl as TeacherTabId)) {
      setActiveTab(tabFromUrl as TeacherTabId);
    } else if (!tabFromUrl) {
      setActiveTab('overview');
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl as TeacherTabId)) {
      setActiveTab(tabFromUrl as TeacherTabId);
    } else if (!tabFromUrl) {
      setActiveTab('overview');
    }
  }, [tabFromUrl]);

  const handleTabChange = (tabId: TeacherTabId) => {
    setActiveTab(tabId);
    const url = tabId === 'overview' ? '/teacher-dashboard' : `/teacher-dashboard?tab=${tabId}`;
    router.replace(url, { scroll: false });
  };

  const { data, isLoading, error, refetch } = useTeacherDashboard();

  const archiveMut = useArchiveCourseMutation();
  const unarchiveMut = useUnarchiveCourseMutation();
  const deleteMut = useDeleteCourseMutation();
  const duplicateMut = useDuplicateCourseMutation();

  const mutationPending =
    archiveMut.isPending ||
    unarchiveMut.isPending ||
    deleteMut.isPending ||
    duplicateMut.isPending;

  const modalProps = useMemo(() => {
    if (!pending) return null;
    const courseTitle = pending.course.title;
    switch (pending.type) {
      case 'archive':
        return {
          title: t('teacher.confirmArchiveTitle'),
          message: `"${courseTitle}" ${t('teacher.confirmArchiveMessage')}`,
          confirmLabel: t('teacher.confirmArchiveBtn'),
          variant: 'default' as const,
        };
      case 'unarchive':
        return {
          title: t('teacher.confirmUnarchiveTitle'),
          message: `"${courseTitle}" ${t('teacher.confirmUnarchiveMessage')}`,
          confirmLabel: t('teacher.confirmUnarchiveBtn'),
          variant: 'default' as const,
        };
      case 'delete':
        return {
          title: t('teacher.confirmDeleteTitle'),
          message: `"${courseTitle}" ${t('teacher.confirmDeleteMessage')}`,
          confirmLabel: t('teacher.confirmDeleteBtn'),
          variant: 'danger' as const,
        };
      case 'duplicate':
        return {
          title: t('teacher.confirmDuplicateTitle'),
          message: `"${courseTitle}" ${t('teacher.confirmDuplicateMessage')}`,
          confirmLabel: t('teacher.confirmDuplicateBtn'),
          variant: 'default' as const,
        };
    }
  }, [pending, t]);

  const handleConfirm = () => {
    if (!pending) return;
    const courseId = pending.course.id;
    const messages: Record<PendingAction['type'], string> = {
      archive: t('teacher.toastArchived'),
      unarchive: t('teacher.toastUnarchived'),
      delete: t('teacher.toastDeleted'),
      duplicate: t('teacher.toastDuplicated'),
    };
    const onSuccess = () => {
      toast.success(messages[pending.type]);
      setPending(null);
    };
    const onError = (err: Error) => toast.error(err.message);

    if (pending.type === 'archive') archiveMut.mutate(courseId, { onSuccess, onError });
    if (pending.type === 'unarchive') unarchiveMut.mutate(courseId, { onSuccess, onError });
    if (pending.type === 'delete') deleteMut.mutate(courseId, { onSuccess, onError });
    if (pending.type === 'duplicate') duplicateMut.mutate(courseId, { onSuccess, onError });
  };

  const headerKeys = TAB_TITLE_KEYS[activeTab];
  const courses = data?.courses ?? [];
  const needsAttention = data?.needsAttention ?? [];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground mb-1">
              {t(headerKeys.titleKey)}
            </h1>
            <p className="text-muted-foreground text-sm">{t(headerKeys.subtitleKey)}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive flex items-center justify-between">
              <span>{t('teacher.errorPrefix')}: {error.message}</span>
              <button onClick={() => refetch()} className="underline text-xs">
                {t('teacher.retryButton')}
              </button>
            </div>
          )}

          {/* Moderation feedback banners (Overview va Courses tab'da) */}
          {(activeTab === 'overview' || activeTab === 'courses') && (
            <NeedsAttentionBanner items={needsAttention} onGoToCourses={() => handleTabChange('courses')} />
          )}

          {activeTab === 'overview' && (
            <OverviewTab data={data} isLoading={isLoading} onCreateCourse={() => router.push('/course-creation')} />
          )}

          {activeTab === 'courses' && (
            <CoursesTab
              courses={courses}
              isLoading={isLoading}
              onAction={setPending}
              onCreate={() => router.push('/course-creation')}
              onEdit={(id) => router.push(`/course-creation?edit=${id}`)}
            />
          )}

          {activeTab === 'earnings' && <EarningsTab data={data} isLoading={isLoading} />}

          {activeTab !== 'overview' &&
            activeTab !== 'courses' &&
            activeTab !== 'earnings' && <SidebarRedirectMessage tab={activeTab} />}
        </div>
      {modalProps && pending && (
        <ConfirmModal
          open={true}
          title={modalProps.title}
          message={modalProps.message}
          confirmLabel={modalProps.confirmLabel}
          variant={modalProps.variant}
          isLoading={mutationPending}
          onConfirm={handleConfirm}
          onCancel={() => !mutationPending && setPending(null)}
        />
      )}
    </main>
  );
};

// ─── Sub-komponentlar ─────────────────────────────────────────────────────

function NeedsAttentionBanner({
  items,
  onGoToCourses,
}: {
  items: Array<{ type: string; courseId: string; courseTitle: string; feedback: string | null }>;
  onGoToCourses: () => void;
}) {
  const { t } = useI18n();
  if (items.length === 0) return null;
  return (
    <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-md">
      <div className="flex items-start gap-3">
        <Icon name="ExclamationTriangleIcon" size={24} className="text-warning shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-foreground">
            {t('teacher.needsAttentionTitle')} ({items.length})
          </h3>
          <div className="mt-2 space-y-2">
            {items.slice(0, 3).map((it) => (
              <div key={it.courseId} className="text-sm">
                <p className="text-foreground">
                  <strong>{it.courseTitle}</strong> —{' '}
                  <span className="text-destructive">
                    {it.type === 'rejected' ? t('teacher.rejectedLabel') : t('teacher.revisionRequestedLabel')}
                  </span>
                </p>
                {it.feedback && (
                  <p className="text-xs text-muted-foreground mt-1 pl-2 border-l-2 border-warning">
                    Admin: {it.feedback}
                  </p>
                )}
              </div>
            ))}
          </div>
          {items.length > 3 && (
            <button onClick={onGoToCourses} className="mt-2 text-xs text-primary underline">
              {t('teacher.moreItems')} {items.length - 3} — {t('teacher.viewAllAttention')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({
  data,
  isLoading,
  onCreateCourse,
}: {
  data: ReturnType<typeof useTeacherDashboard>['data'];
  isLoading: boolean;
  onCreateCourse: () => void;
}) {
  const { t } = useI18n();
  const stats = data?.stats;
  const topCourses = data?.topCourses ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title={t('teacher.overviewTotalRevenue')}
          value={isLoading ? '—' : formatUzs(stats?.totalRevenueUzs ?? '0')}
          icon="CurrencyDollarIcon"
          subtitle={t('teacher.overviewFromAllCourses')}
        />
        <MetricsCard
          title={t('teacher.overviewActiveCourses')}
          value={isLoading ? '—' : String(stats?.publishedCourses ?? 0)}
          icon="BookOpenIcon"
          subtitle={`${stats?.draftCourses ?? 0} ${t('teacher.overviewDraftSuffix')}`}
        />
        <MetricsCard
          title={t('teacher.overviewTotalStudents')}
          value={isLoading ? '—' : String(stats?.totalEnrollments ?? 0)}
          icon="UserGroupIcon"
          subtitle={`${t('teacher.overviewAvgRating')}: ${(stats?.avgRating ?? 0).toFixed(1)} ⭐`}
        />
        <MetricsCard
          title={t('teacher.overviewInModeration')}
          value={isLoading ? '—' : String(stats?.underReviewCourses ?? 0)}
          icon="ClockIcon"
          subtitle={`${stats?.rejectedCourses ?? 0} ${t('teacher.overviewRejectedSuffix')}`}
        />
      </div>

      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
          {t('teacher.overviewTopCourses')}
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded-md" />
            ))}
          </div>
        ) : topCourses.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="BookOpenIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-3">{t('teacher.overviewNoCourses')}</p>
            <button
              onClick={onCreateCourse}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth text-sm font-medium"
            >
              {t('teacher.overviewCreateFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {topCourses.map((c, idx) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-md hover:bg-muted/40"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl font-heading font-bold text-muted-foreground w-8">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.enrollmentCount} {t('teacher.overviewStudentLabel')} · ⭐ {c.rating.toFixed(1)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-success shrink-0">
                  {formatUzs(c.revenueUzs)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
          {t('teacher.overviewRecentPayments')}
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded-md" />
            ))}
          </div>
        ) : (data?.recentTransactions.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('teacher.overviewNoPayments')}</p>
        ) : (
          <div className="space-y-2">
            {data?.recentTransactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 border border-border rounded-md"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{t.studentName}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.courseTitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-success">{formatUzs(t.amountUzs)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CoursesTab({
  courses,
  isLoading,
  onAction,
  onCreate,
  onEdit,
}: {
  courses: TeacherDashboardCourse[];
  isLoading: boolean;
  onAction: (a: PendingAction) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
}) {
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const { t } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{courses.length} {t('teacher.coursesCount')}</p>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="PlusIcon" size={18} />
          {t('teacher.coursesNewCourse')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-card h-64 rounded-md" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-card rounded-md shadow-warm p-12 text-center">
          <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">{t('teacher.coursesNoCourses')}</h3>
          <p className="text-muted-foreground mb-6">{t('teacher.coursesCreateFirst')}</p>
          <button
            onClick={onCreate}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
          >
            {t('teacher.coursesCreateCourse')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const badgeData = STATUS_BADGE_KEYS[course.moderationStatus];
            const menuOpen = openMenuFor === course.id;
            return (
              <div
                key={course.id}
                className="bg-card rounded-md shadow-warm overflow-hidden border border-border hover:shadow-warm-md transition-smooth"
              >
                <div className="relative h-32 bg-muted">
                  {course.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={course.coverImage}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="BookOpenIcon" size={32} className="text-muted-foreground" />
                    </div>
                  )}
                  <span
                    className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${badgeData.color}`}
                  >
                    {t(badgeData.labelKey)}
                  </span>
                </div>
                <div className="p-4">
                  <h4 className="font-heading font-semibold text-foreground line-clamp-2 mb-2">
                    {course.title}
                  </h4>

                  {course.adminFeedback && course.moderationStatus === 'rejected' && (
                    <div className="mb-2 p-2 bg-destructive/10 rounded text-xs text-destructive border-l-2 border-destructive">
                      <strong>Admin:</strong> {course.adminFeedback}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                    <div>👥 {course.enrollmentCount} {t('teacher.coursesStudentLabel')}</div>
                    <div>⭐ {course.rating.toFixed(1)} ({course.reviewCount})</div>
                    <div>📚 {course.topicCount} {t('teacher.coursesTopicLabel')}</div>
                    <div>📅 {formatDate(course.createdAt)}</div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm font-semibold text-success">
                      {formatUzs(course.revenueUzs)}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuFor(menuOpen ? null : course.id)}
                        className="p-1.5 hover:bg-muted rounded transition-smooth"
                        aria-label={t('teacher.coursesActionsLabel')}
                      >
                        <Icon name="EllipsisVerticalIcon" size={18} className="text-muted-foreground" />
                      </button>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuFor(null)} />
                          <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-warm-lg z-20 py-1">
                            <MenuItem
                              icon="ListBulletIcon"
                              label={t('teacher.menuTopics')}
                              color="text-primary"
                              onClick={() => {
                                setOpenMenuFor(null);
                                window.location.href = `/teacher-dashboard/courses/${course.id}`;
                              }}
                            />
                            <MenuItem
                              icon="PencilIcon"
                              label={t('teacher.menuEdit')}
                              onClick={() => {
                                setOpenMenuFor(null);
                                onEdit(course.id);
                              }}
                            />
                            <MenuItem
                              icon="DocumentDuplicateIcon"
                              label={t('teacher.menuDuplicate')}
                              onClick={() => {
                                setOpenMenuFor(null);
                                onAction({ type: 'duplicate', course });
                              }}
                            />
                            {course.isPublished ? (
                              <MenuItem
                                icon="ArchiveBoxIcon"
                                label={t('teacher.menuArchive')}
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  onAction({ type: 'archive', course });
                                }}
                              />
                            ) : (
                              <MenuItem
                                icon="PlayCircleIcon"
                                label={t('teacher.menuActivate')}
                                color="text-success"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  onAction({ type: 'unarchive', course });
                                }}
                              />
                            )}
                            <div className="border-t border-border my-1" />
                            <MenuItem
                              icon="TrashIcon"
                              label={t('teacher.menuDelete')}
                              color="text-destructive"
                              onClick={() => {
                                setOpenMenuFor(null);
                                onAction({ type: 'delete', course });
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
      className={`w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 ${color}`}
    >
      <Icon name={icon} size={16} />
      {label}
    </button>
  );
}

function EarningsTab({
  data,
  isLoading,
}: {
  data: ReturnType<typeof useTeacherDashboard>['data'];
  isLoading: boolean;
}) {
  const { t } = useI18n();
  const stats = data?.stats;
  const transactions = data?.recentTransactions ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-md shadow-warm p-6">
          <p className="text-sm text-muted-foreground mb-1">{t('teacher.earningsCurrentBalance')}</p>
          <p className="text-3xl font-heading font-bold text-foreground">
            {isLoading ? '—' : formatUzs(stats?.totalRevenueUzs ?? '0')}
          </p>
        </div>
        <div className="bg-card rounded-md shadow-warm p-6">
          <p className="text-sm text-muted-foreground mb-1">{t('teacher.earningsPendingPayment')}</p>
          <p className="text-3xl font-heading font-bold text-foreground">0 so'm</p>
          <p className="text-xs text-muted-foreground mt-1">{t('teacher.earningsWithdrawPhase')}</p>
        </div>
        <div className="bg-card rounded-md shadow-warm p-6 flex items-center justify-center">
          <button
            disabled
            className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-md cursor-not-allowed font-medium"
          >
            {t('teacher.earningsWithdrawBtn')}
          </button>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
          {t('teacher.earningsPaymentHistory')}
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded-md" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">{t('teacher.earningsNoPayments')}</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 border border-border rounded-md"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{t.studentName}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.courseTitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-success">{formatUzs(t.amountUzs)}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SidebarRedirectMessage({ tab }: { tab: TeacherTabId }) {
  const { t } = useI18n();
  const keys = TAB_TITLE_KEYS[tab];
  const tabTitle = keys ? t(keys.titleKey) : tab;
  return (
    <div className="bg-card rounded-md shadow-warm p-12 text-center">
      <Icon name="Bars3Icon" size={48} className="text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{tabTitle}</h3>
      <p className="text-muted-foreground">
        {t('teacher.sidebarRedirectMessage')}
      </p>
    </div>
  );
}

export default TeacherDashboardInteractive;
