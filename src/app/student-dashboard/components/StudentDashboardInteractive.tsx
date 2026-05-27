'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WelcomeSection from './WelcomeSection';
import ContinueLearningCard from './ContinueLearningCard';
import CourseCard from './CourseCard';
import RecommendedCourseCard from './RecommendedCourseCard';
import CertificateCard from './CertificateCard';
import StreakAlert from './StreakAlert';
import ContinueLearningHero from './ContinueLearningHero';
import ActivityHeatmap from './ActivityHeatmap';
import ActivityHeatmapSkeleton from './ActivityHeatmapSkeleton';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import QuickActions from './QuickActions';
import Icon from '@/components/ui/AppIcon';
import type {
  DashboardEnrollment,
} from '@/types/dashboard.types';
import type { RecommendedCourse } from '@/types/recommendation.types';
import { useStudentDashboard } from '@/hooks/queries/useStudentDashboard';
import { useActivityCalendar } from '@/hooks/queries/useActivityCalendar';

type DashboardTab = 'continue' | 'my-courses' | 'recommended';
const VALID_TABS: DashboardTab[] = ['continue', 'my-courses', 'recommended'];

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1516101922849-2bf0be616449';

/**
 * Hero card uchun eng "tegishli" enrollment'ni topish:
 *  1. In-progress (0 < progress < 100) — lastAccessedAt DESC, fallback enrolledAt DESC
 *  2. Yo'q bo'lsa — not started (progress = 0) — enrolledAt DESC
 *  3. Hech narsa yo'q yoki barchasi 100% — null
 */
function getMostRecentInProgress(
  enrollments: DashboardEnrollment[],
): DashboardEnrollment | null {
  const inProgress = enrollments.filter((e) => !e.isCompleted && e.progress > 0);

  const compareDesc = (a: DashboardEnrollment, b: DashboardEnrollment) => {
    const at = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : new Date(a.enrolledAt).getTime();
    const bt = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : new Date(b.enrolledAt).getTime();
    return bt - at;
  };

  if (inProgress.length > 0) {
    return [...inProgress].sort(compareDesc)[0];
  }

  const notStarted = enrollments.filter((e) => e.progress === 0);
  if (notStarted.length > 0) {
    return [...notStarted].sort(compareDesc)[0];
  }

  return null;
}

const StudentDashboardInteractive = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (() => {
    const t = searchParams?.get('tab');
    return VALID_TABS.includes(t as DashboardTab) ? (t as DashboardTab) : 'continue';
  })();

  const [isHydrated, setIsHydrated] = useState(false);
  const [activeView, setActiveView] = useState<DashboardTab>(initialTab);
  const [userName, setUserName] = useState('Foydalanuvchi');

  // Dashboard data — TanStack Query (cached + auto refetch)
  const dashboardQuery = useStudentDashboard();
  const data = dashboardQuery.data;
  const loadingCourses = dashboardQuery.isLoading;

  const enrollments = data?.enrollments ?? [];
  const recommended = data?.recommended ?? [];
  const certificates = data?.certificates ?? [];
  const stats = data?.stats ?? {
    enrolledCount: 0,
    coursesCompleted: 0,
    certificatesEarned: 0,
    streak: { current: 0, longest: 0, activeToday: false },
  };

  // Activity heatmap — responsive days
  const [heatmapDays, setHeatmapDays] = useState(90);
  const activityQuery = useActivityCalendar(heatmapDays, stats.enrolledCount > 0);
  const activities = activityQuery.data?.activities ?? [];
  const activityLoading = activityQuery.isLoading;

  // Recommendations: category filter + "Yana tavsiya" (manual fetch — chunki exclude key dynamic)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [extraRecommendations, setExtraRecommendations] = useState<RecommendedCourse[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // User name (faqat 1 marta — AuthContext bilan birga keladi keyinroq)
  useEffect(() => {
    setIsHydrated(true);
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.user?.fullName) setUserName(d.user.fullName);
        else if (dashboardQuery.isError && (dashboardQuery.error as any)?.message?.includes('401')) {
          router.push('/login');
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 401 handling — dashboardQuery xato berganida login'ga
  useEffect(() => {
    if (dashboardQuery.error?.message?.includes('401')) {
      router.push('/login');
    }
  }, [dashboardQuery.error, router]);

  const handleLoadMoreRecommendations = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const allIds = [...recommended, ...extraRecommendations].map((c) => c.id);
      const params = new URLSearchParams({ limit: '6' });
      if (allIds.length > 0) params.set('exclude', allIds.join(','));
      const res = await fetch(`/api/student/recommendations?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setExtraRecommendations((prev) => [...prev, ...(data.recommendations ?? [])]);
    } catch (err) {
      console.error('Yana tavsiya yuklashda xato:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // URL `?tab=` o'zgarganida active tab'ni yangilash (header link bosilganda)
  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && VALID_TABS.includes(t as DashboardTab) && t !== activeView) {
      setActiveView(t as DashboardTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Heatmap responsive: mobile 30 / tablet 60 / desktop 90 kun
  useEffect(() => {
    const updateDays = () => {
      const w = window.innerWidth;
      if (w < 640) setHeatmapDays(30);
      else if (w < 1024) setHeatmapDays(60);
      else setHeatmapDays(90);
    };
    updateDays();
    window.addEventListener('resize', updateDays);
    return () => window.removeEventListener('resize', updateDays);
  }, []);

  const handleCertificateDownload = (certificateId: string) => {
    window.open(`/api/certificates/${certificateId}`, '_blank');
  };

  // Hero card uchun eng so'nggi ochilgan in-progress kurs
  const heroEnrollment = getMostRecentInProgress(enrollments);

  // Tab uchun filterlangan ro'yxatlar
  const continueLearning = enrollments
    .filter((e) => e.progress > 0 && !e.isCompleted)
    .slice(0, 4);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-muted rounded-md"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-muted rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <WelcomeSection
              userName={userName}
              stats={{
                coursesCompleted: stats.coursesCompleted,
                certificatesEarned: stats.certificatesEarned,
                streak: stats.streak,
                enrolledCount: stats.enrolledCount,
              }}
            />

            {/* Streak'ni saqlash banner — current>0 va activeToday=false bo'lganda */}
            <StreakAlert
              streak={{ current: stats.streak.current, activeToday: stats.streak.activeToday }}
              mostRecentEnrollment={
                heroEnrollment
                  ? {
                      courseId: heroEnrollment.courseId,
                      nextTopicId: heroEnrollment.nextTopic?.id,
                    }
                  : enrollments[0]
                  ? {
                      courseId: enrollments[0].courseId,
                      nextTopicId: enrollments[0].nextTopic?.id,
                    }
                  : undefined
              }
            />

            {/* Continue Learning Hero — eng so'nggi ochilgan kurs */}
            {heroEnrollment && <ContinueLearningHero enrollment={heroEnrollment} />}

            {/* Activity heatmap — faqat enrollment bo'lsa */}
            {stats.enrolledCount > 0 &&
              (activityLoading ? (
                <ActivityHeatmapSkeleton weeks={Math.ceil(heatmapDays / 7) + 1} />
              ) : (
                <ActivityHeatmap activities={activities} days={heatmapDays} />
              ))}

            <SearchBar
              onSearch={(q) =>
                router.push(`/course-marketplace?search=${encodeURIComponent(q)}`)
              }
            />

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { key: 'continue', label: 'Davom ettirish' },
                { key: 'my-courses', label: 'Mening Kurslarim' },
                { key: 'recommended', label: 'Tavsiya Etilgan' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key as DashboardTab)}
                  className={`px-6 py-2.5 rounded-md whitespace-nowrap transition-smooth flex-shrink-0 ${
                    activeView === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground hover:bg-muted'
                  }`}
                >
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>

            {/* Continue Learning */}
            {activeView === 'continue' && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
                  O'qishni Davom Ettiring
                </h2>
                {loadingCourses ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-48 bg-muted rounded-md animate-pulse"></div>
                    ))}
                  </div>
                ) : continueLearning.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Icon name="PlayCircleIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Hali boshlangan kurs yo'q</h3>
                    <p className="text-muted-foreground mb-6">
                      {enrollments.length > 0
                        ? 'Kurslaringizdan birini boshlang'
                        : 'Birinchi kursingizni sotib oling'}
                    </p>
                    <button
                      onClick={() =>
                        enrollments.length > 0
                          ? setActiveView('my-courses')
                          : router.push('/course-marketplace')
                      }
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {enrollments.length > 0 ? "Kurslarimni Ko'rish" : "Kurslarni Ko'rish"}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {continueLearning.map((e) => (
                      <ContinueLearningCard key={e.id} enrollment={e} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Courses */}
            {activeView === 'my-courses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-heading font-bold text-foreground">Mening Kurslarim</h2>
                </div>
                {loadingCourses ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                        <div className="w-full h-40 bg-muted rounded-md mb-4"></div>
                        <div className="h-6 bg-muted rounded mb-2"></div>
                        <div className="h-4 bg-muted rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : enrollments.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Hali kurslar yo'q</h3>
                    <p className="text-muted-foreground mb-6">Birinchi kursingizni sotib oling va o'qishni boshlang</p>
                    <button
                      onClick={() => router.push('/course-marketplace')}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Kurslarni Ko'rish
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((e) => (
                      <CourseCard key={e.id} enrollment={e} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recommended */}
            {activeView === 'recommended' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-heading font-bold text-foreground">Tavsiya Etilgan Kurslar</h2>
                </div>
                <div className="mb-4">
                  <CategoryFilter
                    selectedSlug={selectedCategory}
                    onSelect={setSelectedCategory}
                  />
                </div>
                {(() => {
                  const all = [...recommended, ...extraRecommendations];
                  const filtered = selectedCategory
                    ? all.filter((c) => c.category?.slug === selectedCategory)
                    : all;

                  if (loadingCourses) {
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2].map((i) => (
                          <div key={i} className="h-48 bg-muted rounded-md animate-pulse"></div>
                        ))}
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-12 text-muted-foreground">
                        {selectedCategory
                          ? "Bu kategoriyada hozircha tavsiya yo'q"
                          : "Barcha kurslar allaqachon sizning ro'yxatingizda"}
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filtered.map((course) => (
                          <RecommendedCourseCard key={course.id} course={course} />
                        ))}
                      </div>
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={handleLoadMoreRecommendations}
                          disabled={loadingMore}
                          className="px-6 py-3 bg-card border border-border text-foreground rounded-md hover:bg-muted transition-smooth disabled:opacity-50 flex items-center gap-2"
                        >
                          {loadingMore ? (
                            <>
                              <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                              <span>Yuklanmoqda...</span>
                            </>
                          ) : (
                            <>
                              <Icon name="ArrowPathIcon" size={18} />
                              <span>Yana tavsiya ko'rish</span>
                            </>
                          )}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-md shadow-warm p-4">
              <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Tez Harakatlar</h3>
              <QuickActions />
            </div>

            <div className="bg-card rounded-md shadow-warm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-semibold text-foreground">Sertifikatlar</h3>
                <Icon name="AcademicCapIcon" size={20} className="text-primary" />
              </div>
              {certificates.length === 0 ? (
                <div className="text-center py-6">
                  <Icon name="AcademicCapIcon" size={40} className="text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Hali sertifikat yo'q</p>
                  <p className="text-xs text-muted-foreground mt-1">Kurs tugatganingizda paydo bo'ladi</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {certificates.slice(0, 2).map((cert) => (
                      <CertificateCard
                        key={cert.id}
                        certificate={{
                          id: cert.id,
                          courseTitle: cert.courseTitle,
                          completionDate: new Date(cert.issuedAt).toLocaleDateString('uz-UZ'),
                          certificateNumber: cert.certificateNumber,
                        }}
                        onDownload={() => handleCertificateDownload(cert.id)}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => router.push('/certificates')}
                    className="w-full mt-4 text-sm text-primary hover:underline font-medium"
                  >
                    Hammasini ko'rish ({certificates.length}) →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardInteractive;
