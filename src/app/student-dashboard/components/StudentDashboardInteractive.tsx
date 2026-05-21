'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import WelcomeSection from './WelcomeSection';
import ContinueLearningCard from './ContinueLearningCard';
import CourseCard from './CourseCard';
import RecommendedCourseCard from './RecommendedCourseCard';
import AchievementCard from './AchievementCard';
import QuizDeadlineCard from './QuizDeadlineCard';
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

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  type: 'certificate' | 'badge' | 'milestone';
}

interface QuizDeadline {
  id: string;
  courseTitle: string;
  topicTitle: string;
  dueDate: string;
  daysRemaining: number;
  isUrgent: boolean;
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

const StudentDashboardInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeView, setActiveView] = useState<'continue' | 'my-courses' | 'recommended'>('continue');
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('Foydalanuvchi');
  const [userStats, setUserStats] = useState({ coursesCompleted: 0, certificatesEarned: 0, currentStreak: 0 });
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [continueLearning, setContinueLearning] = useState<ContinueLearningCourse[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [recommended, setRecommended] = useState<RecommendedCourse[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);

  const mockAchievements: Achievement[] = [
    { id: '1', title: 'Birinchi Kurs', description: 'Birinchi kursga yozildingiz', icon: 'TrophyIcon', earnedDate: 'Bugun', type: 'milestone' },
    { id: '2', title: '7 Kunlik Seriya', description: 'Ketma-ket 7 kun o\'qidingiz', icon: 'FireIcon', earnedDate: 'Bu hafta', type: 'milestone' },
  ];

  const mockDeadlines: QuizDeadline[] = [];

  const mockCategories: Category[] = [
    { id: 'programming', name: 'Dasturlash', icon: 'CodeBracketIcon' },
    { id: 'design', name: 'Dizayn', icon: 'PaintBrushIcon' },
    { id: 'business', name: 'Biznes', icon: 'BriefcaseIcon' },
    { id: 'language', name: 'Tillar', icon: 'LanguageIcon' },
  ];

  useEffect(() => {
    setIsHydrated(true);
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Load user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (profile) setUserName(profile.full_name);

      // Load enrolled courses (from enrollments table: student_id)
      setLoadingCourses(true);
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id,
          progress,
          enrolled_at,
          completed_at,
          is_active,
          courses (
            id,
            title,
            cover_image,
            total_duration,
            user_profiles!teacher_id (full_name)
          )
        `)
        .eq('student_id', user.id)
        .eq('is_active', true)
        .order('enrolled_at', { ascending: false });

      if (enrollments) {
        const inProgress: ContinueLearningCourse[] = [];
        const allCourses: Course[] = [];
        let completedCount = 0;

        enrollments.forEach((e: any) => {
          const c = e.courses;
          if (!c) return;

          const progress = e.progress || 0;
          if (progress >= 100) completedCount++;

          const courseObj: Course = {
            id: c.id,
            title: c.title,
            instructor: c.user_profiles?.full_name || 'Ustoz',
            coverImage: c.cover_image || 'https://images.unsplash.com/photo-1516101922849-2bf0be616449',
            coverImageAlt: `${c.title} kursi`,
            progress,
            lastAccessed: e.enrolled_at
              ? new Date(e.enrolled_at).toLocaleDateString('uz-UZ')
              : 'Noma\'lum',
            totalTopics: c.total_duration || 0,
            completedTopics: Math.round(((c.total_duration || 0) * progress) / 100),
            isCompleted: progress >= 100,
          };
          allCourses.push(courseObj);

          if (progress > 0 && progress < 100) {
            inProgress.push({
              id: c.id,
              title: c.title,
              instructor: c.user_profiles?.full_name || 'Ustoz',
              coverImage: c.cover_image || 'https://images.unsplash.com/photo-1516101922849-2bf0be616449',
              coverImageAlt: `${c.title} kursi`,
              progress,
              nextTopic: 'Keyingi mavzu',
              totalTopics: c.total_duration || 0,
              completedTopics: Math.round(((c.total_duration || 0) * progress) / 100),
            });
          }
        });

        setContinueLearning(inProgress.slice(0, 4));
        setMyCourses(allCourses);
        setUserStats((prev) => ({ ...prev, coursesCompleted: completedCount }));
      }

      // Load recommended: published courses NOT enrolled in
      const enrolledIds = (enrollments || []).map((e: any) => e.courses?.id).filter(Boolean);
      let recQuery = supabase
        .from('courses')
        .select(`
          id, title, cover_image, price_uzs, rating, enrollment_count, language,
          user_profiles!teacher_id (full_name)
        `)
        .eq('is_published', true)
        .order('rating', { ascending: false })
        .limit(6);

      if (enrolledIds.length > 0) {
        recQuery = recQuery.not('id', 'in', `(${enrolledIds.join(',')})`);
      }

      const { data: recData } = await recQuery;
      if (recData) {
        setRecommended(
          recData.map((c: any) => ({
            id: c.id,
            title: c.title,
            instructor: c.user_profiles?.full_name || 'Ustoz',
            coverImage: c.cover_image || 'https://images.unsplash.com/photo-1516101922849-2bf0be616449',
            coverImageAlt: `${c.title} kursi`,
            category: 'Kurs',
            price: c.price_uzs || 0,
            currency: 'UZS',
            rating: Number(c.rating) || 0,
            studentsCount: c.enrollment_count || 0,
            duration: `${Math.round((c.enrollment_count || 0) / 10)} soat`,
          }))
        );
      }

      // Load completed courses as certificates
      const completed = (enrollments || []).filter((e: any) => (e.progress || 0) >= 100);
      setCertificates(
        completed.map((e: any, i: number) => ({
          id: e.id,
          courseTitle: e.courses?.title || 'Kurs',
          completionDate: e.completed_at
            ? new Date(e.completed_at).toLocaleDateString('uz-UZ')
            : new Date(e.enrolled_at).toLocaleDateString('uz-UZ'),
          certificateNumber: `CERT-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
        }))
      );
    } catch (err) {
      console.error('Dashboard yuklashda xato:', err);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleCertificateDownload = (certificateId: string) => {
    console.log('Sertifikat yuklab olinmoqda:', certificateId);
  };

  const displayContinueLearning = continueLearning.length > 0 ? continueLearning : [];
  const displayMyCourses = myCourses;

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
                currentStreak: userStats.currentStreak,
              }}
            />

            <SearchBar onSearch={(q) => console.log('Qidiruv:', q)} />

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
                ) : displayContinueLearning.length === 0 ? (
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
                    {displayContinueLearning.map((course) => (
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
                ) : displayMyCourses.length === 0 ? (
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
                    {displayMyCourses.map((course) => (
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
                  <CategoryFilter categories={mockCategories} onCategorySelect={(id) => console.log(id)} />
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
                <h3 className="text-lg font-heading font-semibold text-foreground">Yutuqlar</h3>
                <Icon name="TrophyIcon" size={20} className="text-accent" />
              </div>
              <div className="space-y-3">
                {mockAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </div>
            </div>

            <div className="bg-card rounded-md shadow-warm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-semibold text-foreground">Test Muddatlari</h3>
                <Icon name="ClockIcon" size={20} className="text-warning" />
              </div>
              {mockDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Hozircha muddatli testlar yo'q</p>
              ) : (
                <div className="space-y-3">
                  {mockDeadlines.map((d) => <QuizDeadlineCard key={d.id} deadline={d} />)}
                </div>
              )}
            </div>

            <div className="bg-card rounded-md shadow-warm p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-heading font-semibold text-foreground">Sertifikatlar</h3>
                <Icon name="AcademicCapIcon" size={20} className="text-primary" />
              </div>
              {certificates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Hali sertifikat yo'q</p>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <CertificateCard
                      key={cert.id}
                      certificate={cert}
                      onDownload={() => handleCertificateDownload(cert.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardInteractive;
