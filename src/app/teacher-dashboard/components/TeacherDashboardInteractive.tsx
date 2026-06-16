'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
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

const TAB_TITLES: Record<TeacherTabId, { title: string; subtitle: string }> = {
  overview: { title: "Umumiy ko'rinish", subtitle: 'Bugungi holat va kurslar' },
  courses: { title: 'Kurslarim', subtitle: 'Barcha kurslar va statusi' },
  students: { title: 'Talabalarim', subtitle: "Yozilgan talabalar ro'yxati" },
  groups: { title: 'Guruhlar', subtitle: 'Talabalar guruhlari' },
  assignments: { title: 'Topshiriqlar', subtitle: 'Uy vazifalari' },
  tests: { title: 'Testlar', subtitle: 'Quiz va testlar' },
  analytics: { title: 'Tahlil', subtitle: 'Daromad va faollik' },
  earnings: { title: 'Daromad', subtitle: "To'lov tarixi va withdraw" },
  reviews: { title: 'Sharhlar', subtitle: 'Talaba sharhlari' },
  certificates: { title: 'Sertifikatlar', subtitle: 'Berilgan sertifikatlar' },
  messages: { title: 'Xabarlar', subtitle: 'Talabalar bilan aloqa' },
};

const STATUS_BADGE: Record<ModerationStatusDTO, { label: string; color: string }> = {
  draft: { label: 'Qoralama', color: 'bg-muted text-muted-foreground' },
  submitted: { label: 'Yuborilgan', color: 'bg-warning/10 text-warning' },
  under_review: { label: "Ko'rib chiqilmoqda", color: 'bg-secondary/10 text-secondary' },
  approved: { label: 'Tasdiqlangan', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rad etilgan', color: 'bg-destructive/10 text-destructive' },
  revision_requested: {
    label: "O'zgartirish so'ralgan",
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
    const title = pending.course.title;
    switch (pending.type) {
      case 'archive':
        return {
          title: 'Kursni arxivlash',
          message: `"${title}" kursi marketplace'dan yashiriladi (talabalar ko'rmaydi). Qaytarish mumkin.`,
          confirmLabel: 'Arxivlash',
          variant: 'default' as const,
        };
      case 'unarchive':
        return {
          title: 'Kursni faollashtirish',
          message: `"${title}" kursi yana ko'rinarli bo'ladi.`,
          confirmLabel: 'Faollashtirish',
          variant: 'default' as const,
        };
      case 'delete':
        return {
          title: "Kursni o'chirish",
          message: `"${title}" kursini butunlay o'chiramizmi? Bu amalni qaytarib bo'lmaydi.`,
          confirmLabel: "O'chirish",
          variant: 'danger' as const,
        };
      case 'duplicate':
        return {
          title: 'Kursni nusxalash',
          message: `"${title}" asosida yangi qoralama yaratiladi (barcha mavzular bilan).`,
          confirmLabel: 'Nusxalash',
          variant: 'default' as const,
        };
    }
  }, [pending]);

  const handleConfirm = () => {
    if (!pending) return;
    const courseId = pending.course.id;
    const messages: Record<PendingAction['type'], string> = {
      archive: 'Kurs arxivlandi',
      unarchive: 'Kurs faollashtirildi',
      delete: "Kurs o'chirildi",
      duplicate: 'Nusxa yaratildi',
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

  const headerInfo = TAB_TITLES[activeTab];
  const courses = data?.courses ?? [];
  const needsAttention = data?.needsAttention ?? [];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 hidden md:block">
            <h1 className="text-2xl lg:text-3xl font-heading font-bold text-foreground mb-1">
              {headerInfo.title}
            </h1>
            <p className="text-muted-foreground text-sm">{headerInfo.subtitle}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive flex items-center justify-between">
              <span>Xato: {error.message}</span>
              <button onClick={() => refetch()} className="underline text-xs">
                Qayta urinish
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
  if (items.length === 0) return null;
  return (
    <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-md">
      <div className="flex items-start gap-3">
        <Icon name="ExclamationTriangleIcon" size={24} className="text-warning shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-semibold text-foreground">
            Diqqat talab qiladigan kurslar ({items.length})
          </h3>
          <div className="mt-2 space-y-2">
            {items.slice(0, 3).map((it) => (
              <div key={it.courseId} className="text-sm">
                <p className="text-foreground">
                  <strong>{it.courseTitle}</strong> —{' '}
                  <span className="text-destructive">
                    {it.type === 'rejected' ? 'Rad etilgan' : "O'zgartirish so'ralgan"}
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
              Yana {items.length - 3} ta — barchasini ko'rish
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
  const stats = data?.stats;
  const topCourses = data?.topCourses ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Umumiy daromad"
          value={isLoading ? '—' : formatUzs(stats?.totalRevenueUzs ?? '0')}
          icon="CurrencyDollarIcon"
          subtitle="Barcha kurslardan"
        />
        <MetricsCard
          title="Faol kurslar"
          value={isLoading ? '—' : String(stats?.publishedCourses ?? 0)}
          icon="BookOpenIcon"
          subtitle={`${stats?.draftCourses ?? 0} qoralama`}
        />
        <MetricsCard
          title="Jami talabalar"
          value={isLoading ? '—' : String(stats?.totalEnrollments ?? 0)}
          icon="UserGroupIcon"
          subtitle={`O'rtacha reyting: ${(stats?.avgRating ?? 0).toFixed(1)} ⭐`}
        />
        <MetricsCard
          title="Moderatsiyada"
          value={isLoading ? '—' : String(stats?.underReviewCourses ?? 0)}
          icon="ClockIcon"
          subtitle={`${stats?.rejectedCourses ?? 0} rad etilgan`}
        />
      </div>

      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
          Top kurslar (daromad bo'yicha)
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
            <p className="text-muted-foreground mb-3">Hozircha kurslar yo'q</p>
            <button
              onClick={onCreateCourse}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth text-sm font-medium"
            >
              Birinchi kursni yarating
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
                      {c.enrollmentCount} talaba · ⭐ {c.rating.toFixed(1)}
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
          Oxirgi to'lovlar
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded-md" />
            ))}
          </div>
        ) : (data?.recentTransactions.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Hozircha to'lovlar yo'q</p>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{courses.length} ta kurs</p>
        <button
          onClick={onCreate}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth flex items-center gap-2 text-sm font-medium"
        >
          <Icon name="PlusIcon" size={18} />
          Yangi kurs
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
          <h3 className="text-xl font-semibold text-foreground mb-2">Hali kurslar yo'q</h3>
          <p className="text-muted-foreground mb-6">Birinchi kursingizni yarating</p>
          <button
            onClick={onCreate}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth"
          >
            Kurs yaratish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const badge = STATUS_BADGE[course.moderationStatus];
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
                    className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                  >
                    {badge.label}
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
                    <div>👥 {course.enrollmentCount} talaba</div>
                    <div>⭐ {course.rating.toFixed(1)} ({course.reviewCount})</div>
                    <div>📚 {course.topicCount} mavzu</div>
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
                        aria-label="Amallar"
                      >
                        <Icon name="EllipsisVerticalIcon" size={18} className="text-muted-foreground" />
                      </button>
                      {menuOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuFor(null)} />
                          <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-md shadow-warm-lg z-20 py-1">
                            <MenuItem
                              icon="ListBulletIcon"
                              label="Mavzular"
                              color="text-primary"
                              onClick={() => {
                                setOpenMenuFor(null);
                                window.location.href = `/teacher-dashboard/courses/${course.id}`;
                              }}
                            />
                            <MenuItem
                              icon="PencilIcon"
                              label="Tahrirlash"
                              onClick={() => {
                                setOpenMenuFor(null);
                                onEdit(course.id);
                              }}
                            />
                            <MenuItem
                              icon="DocumentDuplicateIcon"
                              label="Nusxalash"
                              onClick={() => {
                                setOpenMenuFor(null);
                                onAction({ type: 'duplicate', course });
                              }}
                            />
                            {course.isPublished ? (
                              <MenuItem
                                icon="ArchiveBoxIcon"
                                label="Arxivlash"
                                onClick={() => {
                                  setOpenMenuFor(null);
                                  onAction({ type: 'archive', course });
                                }}
                              />
                            ) : (
                              <MenuItem
                                icon="PlayCircleIcon"
                                label="Faollashtirish"
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
                              label="O'chirish"
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
  const stats = data?.stats;
  const transactions = data?.recentTransactions ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-md shadow-warm p-6">
          <p className="text-sm text-muted-foreground mb-1">Joriy balans</p>
          <p className="text-3xl font-heading font-bold text-foreground">
            {isLoading ? '—' : formatUzs(stats?.totalRevenueUzs ?? '0')}
          </p>
        </div>
        <div className="bg-card rounded-md shadow-warm p-6">
          <p className="text-sm text-muted-foreground mb-1">Kutilayotgan to'lov</p>
          <p className="text-3xl font-heading font-bold text-foreground">0 so'm</p>
          <p className="text-xs text-muted-foreground mt-1">(Withdraw flow keyingi phase'da)</p>
        </div>
        <div className="bg-card rounded-md shadow-warm p-6 flex items-center justify-center">
          <button
            disabled
            className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-md cursor-not-allowed font-medium"
          >
            Pulni yechib olish (Tez orada)
          </button>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-4">
          To'lov tarixi
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded-md" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Hozircha to'lovlar yo'q</p>
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
  const tabTitle = TAB_TITLES[tab]?.title || tab;
  return (
    <div className="bg-card rounded-md shadow-warm p-12 text-center">
      <Icon name="Bars3Icon" size={48} className="text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{tabTitle}</h3>
      <p className="text-muted-foreground">
        Chap paneldagi menyudan foydalaning
      </p>
    </div>
  );
}

export default TeacherDashboardInteractive;
