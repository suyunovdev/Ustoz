'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import WelcomeSection from './WelcomeSection';
import ContinueLearningCard from './ContinueLearningCard';
import CourseCard from './CourseCard';
import RecommendedCourseCard from './RecommendedCourseCard';
import CertificateCard from './CertificateCard';
import SearchBar from './SearchBar';
import CategoryFilter from './CategoryFilter';
import QuickActions from './QuickActions';
import Icon from '@/components/ui/AppIcon';

interface ContinueLearningCourse {
  id: string;
  title: string;
  instructor: string;
  coverImage: string;
  coverImageAlt: string;
  progress: number;
  nextTopic: string;
  totalTopics: number;
  completedTopics: number;
}

interface Course {
  id: string;
  title: string;
  instructor: string;
  coverImage: string;
  coverImageAlt: string;
  progress: number;
  lastAccessed: string;
  totalTopics: number;
  completedTopics: number;
  isCompleted: boolean;
}

interface RecommendedCourse {
  id: string;
  title: string;
  instructor: string;
  coverImage: string;
  coverImageAlt: string;
  category: string;
  price: number;
  currency: string;
  rating: number;
  studentsCount: number;
  duration: string;
}

interface Certificate {
  id: string;
  courseTitle: string;
  completionDate: string;
  certificateNumber: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1516101922849-2bf0be616449';

type DashboardTab = 'continue' | 'my-courses' | 'recommended';
const VALID_TABS: DashboardTab[] = ['continue', 'my-courses', 'recommended'];

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
  const [userStats, setUserStats] = useState({ coursesCompleted: 0, certificatesEarned: 0 });
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [continueLearning, setContinueLearning] = useState<ContinueLearningCourse[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [recommended, setRecommended] = useState<RecommendedCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const categories: Category[] = [
    { id: 'programming', name: 'Dasturlash', icon: 'CodeBracketIcon' },
    { id: 'design', name: 'Dizayn', icon: 'PaintBrushIcon' },
    { id: 'business', name: 'Biznes', icon: 'BriefcaseIcon' },
    { id: 'language', name: 'Tillar', icon: 'LanguageIcon' },
  ];

  useEffect(() => {
    setIsHydrated(true);
    loadDashboard();
  }, []);

  // URL `?tab=` o'zgarganida active tab'ni yangilash (header link bosilganida)
  useEffect(() => {
    const t = searchParams?.get('tab');
    if (t && VALID_TABS.includes(t as DashboardTab) && t !== activeView) {
      setActiveView(t as DashboardTab);
    }
  }, [searchParams]);

  const loadDashboard = async () => {
    try {
      setLoadingCourses(true);

      const [meRes, dataRes] = await Promise.all([
        fetch('/api/auth/me', { credentials: 'include' }),
        fetch('/api/enrollments/my', { credentials: 'include' }),
      ]);

      if (meRes.ok) {
        const me = await meRes.json();
        if (me?.user?.fullName) setUserName(me.user.fullName);
      }

      if (!dataRes.ok) {
        if (dataRes.status === 401) {
          router.push('/login');
          return;
        }
        return;
      }

      const data = await dataRes.json();

      const inProgress: ContinueLearningCourse[] = [];
      const allCourses: Course[] = [];

      (data.enrollments || []).forEach((e: any) => {
        const c = e.course;
        const totalTopics = c.totalTopics || 0;
        const completedTopics = Math.round((totalTopics * (e.progress || 0)) / 100);
        const courseObj: Course = {
          id: c.id,
          title: c.title,
          instructor: c.teacherName || 'Ustoz',
          coverImage: c.coverImage || DEFAULT_COVER,
          coverImageAlt: `${c.title} kursi`,
          progress: e.progress || 0,
          lastAccessed: e.enrolledAt
            ? new Date(e.enrolledAt).toLocaleDateString('uz-UZ')
            : '—',
          totalTopics,
          completedTopics,
          isCompleted: e.isCompleted,
        };
        allCourses.push(courseObj);

        if ((e.progress || 0) > 0 && (e.progress || 0) < 100) {
          inProgress.push({
            id: c.id,
            title: c.title,
            instructor: c.teacherName || 'Ustoz',
            coverImage: c.coverImage || DEFAULT_COVER,
            coverImageAlt: `${c.title} kursi`,
            progress: e.progress,
            nextTopic: 'Keyingi mavzu',
            totalTopics,
            completedTopics,
          });
        }
      });

      setContinueLearning(inProgress.slice(0, 4));
      setMyCourses(allCourses);

      setRecommended(
        (data.recommended || []).map((c: any) => ({
          id: c.id,
          title: c.title,
          instructor: c.teacherName || 'Ustoz',
          coverImage: c.coverImage || DEFAULT_COVER,
          coverImageAlt: `${c.title} kursi`,
          category: c.category || 'Kurs',
          price: Number(c.priceUzs) || 0,
          currency: 'UZS',
          rating: Number(c.rating) || 0,
          studentsCount: c.enrollmentCount || 0,
          duration: c.difficultyLevel || '—',
        }))
      );

      setCertificates(
        (data.certificates || []).map((cert: any) => ({
          id: cert.id,
          courseTitle: cert.courseTitle,
          completionDate: new Date(cert.issuedAt).toLocaleDateString('uz-UZ'),
          certificateNumber: cert.certificateNumber,
        }))
      );

      setUserStats({
        coursesCompleted: data.stats?.coursesCompleted || 0,
        certificatesEarned: data.stats?.certificatesEarned || 0,
      });
    } catch (err) {
      console.error('Dashboard yuklashda xato:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCertificateDownload = (certificateId: string) => {
    window.open(`/api/certificates/${certificateId}`, '_blank');
  };

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
                coursesCompleted: userStats.coursesCompleted,
                certificatesEarned: certificates.length,
                currentStreak: 0,
              }}
            />

            <SearchBar onSearch={(q) => router.push(`/course-marketplace?search=${encodeURIComponent(q)}`)} />

            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {[
                { key: 'continue', label: 'Davom ettirish' },
                { key: 'my-courses', label: 'Mening Kurslarim' },
                { key: 'recommended', label: 'Tavsiya Etilgan' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key as any)}
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
                      {myCourses.length > 0
                        ? 'Kurslaringizdan birini boshlang'
                        : 'Birinchi kursingizni sotib oling'}
                    </p>
                    <button
                      onClick={() => myCourses.length > 0 ? setActiveView('my-courses') : router.push('/course-marketplace')}
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      {myCourses.length > 0 ? "Kurslarimni Ko'rish" : "Kurslarni Ko'rish"}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {continueLearning.map((course) => (
                      <ContinueLearningCard key={course.id} course={course} />
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
                ) : myCourses.length === 0 ? (
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
                    {myCourses.map((course) => (
                      <CourseCard key={course.id} course={course} />
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
                    categories={categories}
                    onCategorySelect={(id) => router.push(`/course-marketplace?category=${id}`)}
                  />
                </div>
                {loadingCourses ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => <div key={i} className="h-48 bg-muted rounded-md animate-pulse"></div>)}
                  </div>
                ) : recommended.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Barcha kurslar allaqachon sizning ro'yxatingizda
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommended.map((course) => (
                      <RecommendedCourseCard key={course.id} course={course} />
                    ))}
                  </div>
                )}
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
                        certificate={cert}
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
