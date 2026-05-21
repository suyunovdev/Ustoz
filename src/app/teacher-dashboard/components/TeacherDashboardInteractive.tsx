// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import DashboardNavigation from '@/components/common/DashboardNavigation';
import MetricsCard from './MetricsCard';
import CourseCard from './CourseCard';
import AnalyticsPanel from './AnalyticsPanel';
import EarningsPanel from './EarningsPanel';
import Icon from '@/components/ui/AppIcon';

interface DashboardCourse {
  id: string;
  title: string;
  coverImage: string | null;
  isPublished: boolean;
  priceUzs: string;
  enrollmentCount: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  studentName: string;
  courseTitle: string;
  amountUzs: string;
  createdAt: string;
}

interface DashboardData {
  courses: DashboardCourse[];
  stats: {
    totalCourses: number;
    publishedCourses: number;
    pendingCourses: number;
    totalEnrollments: number;
    totalRevenueUzs: string;
  };
  monthlyRevenue: { month: string; revenue: number; enrollments: number }[];
  recentTransactions: Transaction[];
  topCourses: { id: string; title: string; enrollmentCount: number; rating: number }[];
}

const TeacherDashboardInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Dashboard ma'lumotlarini API dan olish
  useEffect(() => {
    if (!isHydrated) return;

    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/teacher/dashboard');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 403) {
          router.push('/unauthorized');
          return;
        }
        if (!res.ok) throw new Error('Ma\'lumotlarni yuklashda xatolik');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [isHydrated, router]);

  const handleCreateCourse = () => router.push('/course-creation');
  const handleCreateTest = () => router.push('/sequential-test-builder');
  const handleContentUpload = () => router.push('/content-upload-center');
  const handleCreateGroup = () => router.push('/group-creation');
  const handleEditCourse = (courseId: string) => router.push(`/course-creation?edit=${courseId}`);

  const handleArchiveCourse = async (courseId: string) => {
    if (!confirm('Kursni arxivlashni tasdiqlaysizmi?')) return;
    try {
      const res = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: false }),
      });
      if (res.ok) {
        setData(prev => prev ? {
          ...prev,
          courses: prev.courses.map(c => c.id === courseId ? { ...c, isPublished: false } : c),
        } : null);
      }
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Kursni o\'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo\'lmaydi!')) return;
    try {
      const res = await fetch(`/api/teacher/courses/${courseId}`, { method: 'DELETE' });
      const json = await res.json();
      if (res.ok) {
        setData(prev => prev ? {
          ...prev,
          courses: prev.courses.filter(c => c.id !== courseId),
          stats: { ...prev.stats, totalCourses: prev.stats.totalCourses - 1 },
        } : null);
      } else {
        alert(json.error || 'O\'chirishda xatolik');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleWithdraw = () => setShowWithdrawModal(true);
  const handleTabChange = (tabId: string) => setActiveTab(tabId);

  // Skeleton loader
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16 bg-card" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-muted rounded-md" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-md" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Daromad formatlash
  const formatRevenue = (uzs: string | undefined) => {
    if (!uzs) return '0';
    const num = Number(uzs);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M so'm`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K so'm`;
    return `${num} so'm`;
  };

  const stats = data?.stats;
  const courses = data?.courses || [];
  const monthlyRevenue = data?.monthlyRevenue || [];
  const transactions = data?.recentTransactions || [];

  // AnalyticsPanel uchun ma'lumotlar
  const revenueData = monthlyRevenue.map(m => ({
    month: m.month,
    revenue: m.revenue / 100,
    students: m.enrollments,
  }));

  const topCourses = (data?.topCourses || []).map(c => ({
    name: c.title,
    students: c.enrollmentCount,
    revenue: 0,
    completion: 0,
  }));

  const studentEngagement = [
    { day: 'Dush', activeStudents: 0, quizCompletions: 0, submissions: 0 },
    { day: 'Sesh', activeStudents: 0, quizCompletions: 0, submissions: 0 },
    { day: 'Chor', activeStudents: 0, quizCompletions: 0, submissions: 0 },
    { day: 'Pay', activeStudents: 0, quizCompletions: 0, submissions: 0 },
    { day: 'Jum', activeStudents: 0, quizCompletions: 0, submissions: 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <RoleBasedHeader userRole="teacher" currentPath="/teacher-dashboard" />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground">O'qituvchi paneli</h2>
              <p className="text-muted-foreground mt-1">Kurslaringizni boshqaring va tahlil qiling</p>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <button
                onClick={handleContentUpload}
                className="flex items-center space-x-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium transition-smooth hover:opacity-90"
              >
                <Icon name="ArrowUpTrayIcon" size={20} />
                <span className="hidden sm:inline">Kontent yuklash</span>
              </button>
              <button
                onClick={handleCreateTest}
                className="flex items-center space-x-2 px-4 py-2 bg-accent text-accent-foreground rounded-md font-medium transition-smooth hover:opacity-90"
              >
                <Icon name="AcademicCapIcon" size={20} />
                <span className="hidden sm:inline">Test yaratish</span>
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-md font-medium transition-smooth hover:bg-purple-600"
              >
                <Icon name="UserGroupIcon" size={20} />
                <span className="hidden sm:inline">Guruh yaratish</span>
              </button>
              <button
                onClick={handleCreateCourse}
                className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium transition-smooth hover:bg-primary/90 hover:-translate-y-0.5 shadow-warm"
              >
                <Icon name="PlusCircleIcon" size={20} />
                <span>Yangi kurs yaratish</span>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
              {error}
            </div>
          )}

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <MetricsCard
              title="Umumiy daromad"
              value={formatRevenue(stats?.totalRevenueUzs)}
              icon="CurrencyDollarIcon"
              subtitle="Jami to'lovlar"
            />
            <MetricsCard
              title="Faol kurslar"
              value={loading ? '—' : String(stats?.publishedCourses ?? 0)}
              icon="BookOpenIcon"
              subtitle={`${stats?.pendingCourses ?? 0} arxivda`}
            />
            <MetricsCard
              title="Jami talabalar"
              value={loading ? '—' : String(stats?.totalEnrollments ?? 0)}
              icon="UserGroupIcon"
            />
            <MetricsCard
              title="Jami kurslar"
              value={loading ? '—' : String(stats?.totalCourses ?? 0)}
              icon="ClockIcon"
              subtitle="Barcha kurslar"
            />
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <DashboardNavigation
              userRole="teacher"
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />
          </div>

          {/* Tab: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div className="bg-card rounded-md shadow-warm p-6">
                <h2 className="text-xl font-heading font-semibold text-foreground mb-4">
                  Tezkor ko'rsatkichlar
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Bugungi daromad</p>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {monthlyRevenue.length > 0
                        ? formatRevenue(String(monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0))
                        : '0 so\'m'}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Jami talabalar</p>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {stats?.totalEnrollments ?? 0}
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Faol kurslar</p>
                    <p className="text-2xl font-heading font-bold text-foreground">
                      {stats?.publishedCourses ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Courses Grid */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-heading font-bold text-foreground">Mening Kurslarim</h2>
                  <button
                    onClick={handleCreateCourse}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Icon name="PlusIcon" size={20} />
                    <span>Yangi Kurs</span>
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                        <div className="w-full h-40 bg-muted rounded-md mb-4" />
                        <div className="h-6 bg-muted rounded mb-2" />
                        <div className="h-4 bg-muted rounded w-2/3" />
                      </div>
                    ))}
                  </div>
                ) : courses.length === 0 ? (
                  <div className="bg-card rounded-lg border border-border p-12 text-center">
                    <Icon name="AcademicCapIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Hali kurslar yo'q</h3>
                    <p className="text-muted-foreground mb-6">Birinchi kursingizni yarating</p>
                    <button
                      onClick={handleCreateCourse}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Kurs Yaratish
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                      <CourseCard
                        key={course.id}
                        course={{
                          id: course.id,
                          title: course.title,
                          thumbnail: course.coverImage || 'https://images.unsplash.com/photo-1516101922849-2bf0be616449',
                          thumbnailAlt: course.title,
                          enrolledStudents: course.enrollmentCount,
                          status: course.isPublished ? 'approved' : 'pending',
                          revenue: 0,
                          rating: Number(course.rating),
                          totalRatings: course.reviewCount,
                        }}
                        onEdit={() => handleEditCourse(course.id)}
                        onArchive={() => handleArchiveCourse(course.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Courses */}
          {activeTab === 'courses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-heading font-semibold text-foreground">
                  Barcha kurslar ({courses.length})
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleCreateCourse}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    + Yangi kurs
                  </button>
                </div>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse h-48" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={{
                        id: course.id,
                        title: course.title,
                        thumbnail: course.coverImage || 'https://images.unsplash.com/photo-1516101922849-2bf0be616449',
                        thumbnailAlt: course.title,
                        enrolledStudents: course.enrollmentCount,
                        status: course.isPublished ? 'approved' : 'pending',
                        revenue: 0,
                        rating: Number(course.rating),
                        totalRatings: course.reviewCount,
                      }}
                      onEdit={() => handleEditCourse(course.id)}
                      onArchive={() => handleArchiveCourse(course.id)}
                      onDelete={() => handleDeleteCourse(course.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Analytics */}
          {activeTab === 'analytics' && (
            <AnalyticsPanel
              revenueData={revenueData}
              topCourses={topCourses}
              studentEngagement={studentEngagement}
            />
          )}

          {/* Tab: Earnings */}
          {activeTab === 'earnings' && (
            <EarningsPanel
              currentBalance={0}
              totalEarnings={Number(stats?.totalRevenueUzs ?? 0)}
              pendingPayouts={0}
              transactions={transactions.map(t => ({
                id: t.id,
                date: new Date(t.createdAt).toLocaleDateString('uz-UZ'),
                amount: Number(t.amountUzs),
                status: 'completed' as const,
                courseName: t.courseTitle,
              }))}
              onWithdraw={handleWithdraw}
            />
          )}
        </div>
      </main>

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-300 flex items-center justify-center p-4">
          <div className="bg-card rounded-md shadow-warm-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-heading font-semibold text-foreground">
                Pulni yechib olish
              </h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-2 rounded-md hover:bg-muted transition-smooth"
              >
                <Icon name="XMarkIcon" size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mavjud balans
                </label>
                <div className="px-4 py-3 bg-muted rounded-md">
                  <p className="text-2xl font-heading font-bold text-foreground">
                    {formatRevenue(stats?.totalRevenueUzs)}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Yechib olish miqdori (so'm)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-border rounded-md text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  To'lov 3-5 ish kuni ichida sizning bank hisobingizga o'tkaziladi.
                </p>
              </div>
              <button className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium transition-smooth hover:bg-primary/90">
                Tasdiqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboardInteractive;
