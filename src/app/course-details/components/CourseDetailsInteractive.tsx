'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import CourseHeroSection from './CourseHeroSection';
import CourseCurriculum from './CourseCurriculum';
import CourseReviews from './CourseReviews';
import InstructorBio from './InstructorBio';
import CourseSidebar from './CourseSidebar';
import RelatedCourses from './RelatedCourses';

interface CourseDetails {
  id: string;
  title: string;
  subtitle: string;
  coverImage: string;
  coverImageAlt: string;
  instructor: {
    name: string;
    image: string;
    imageAlt: string;
    rating: number;
    studentsCount: number;
    coursesCount: number;
    bio: string;
  };
  pricing: { usd: number; uzs: number };
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  description: string;
  learningObjectives: string[];
  prerequisites: string[];
  hasCertificate: boolean;
  language: string;
  lastUpdated: string;
  totalDuration: string;
  level: string;
}

interface CurriculumSection {
  id: string;
  title: string;
  topics: {
    id: string;
    title: string;
    duration: string;
    hasQuiz: boolean;
    hasPreview: boolean;
    isLocked: boolean;
  }[];
}

interface Review {
  id: string;
  userName: string;
  userImage: string;
  userImageAlt: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
}

const CourseDetailsInteractive = () => {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'instructor'>('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumSection[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    setIsHydrated(true);
    if (courseId) {
      loadCourse(courseId);
    } else {
      // No courseId — redirect to marketplace
      router.push('/course-marketplace');
    }
  }, [courseId]);

  const loadCourse = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/courses/${id}`, { credentials: 'include' });
      if (!res.ok) {
        router.push('/course-marketplace');
        return;
      }
      const { course: c } = await res.json();
      if (!c) {
        router.push('/course-marketplace');
        return;
      }

      const teacher = c.teacher || {};
      const reviewsData = c.reviews || [];
      const topics = c.topics || [];

      const mapped: CourseDetails = {
        id: c.id,
        title: c.title,
        subtitle: c.description?.split('.')[0] || c.title,
        coverImage: c.coverImage || 'https://images.unsplash.com/photo-1516101922849-2bf0be616449',
        coverImageAlt: `${c.title} kursi`,
        instructor: {
          name: teacher.fullName || 'Ustoz',
          image: teacher.avatarUrl || 'https://img.rocket.new/generatedImages/rocket_gen_img_1f9f88657-1763292682460.png',
          imageAlt: `${teacher.fullName || 'Ustoz'} rasmi`,
          rating: Number(c.rating) || 0,
          studentsCount: c.enrollmentCount || 0,
          coursesCount: 0,
          bio: teacher.bio || `${teacher.fullName || 'Ustoz'} — tajribali o'qituvchi.`,
        },
        pricing: {
          usd: Number(c.priceUsd) || 0,
          uzs: Number(c.priceUzs) || 0,
        },
        rating: Number(c.rating) || 0,
        reviewCount: c.reviewCount || 0,
        enrollmentCount: c.enrollmentCount || 0,
        description: c.description || '',
        learningObjectives: [],
        prerequisites: [],
        hasCertificate: true,
        language: c.language || 'uz',
        lastUpdated: c.createdAt ? new Date(c.createdAt).toLocaleDateString('uz-UZ') : '',
        totalDuration: `${c.totalDuration || 0} soat`,
        level: c.difficultyLevel || "Boshlang'ich",
      };
      setCourse(mapped);

      if (topics.length > 0) {
        const section: CurriculumSection = {
          id: 'section-1',
          title: 'Kurs Mavzulari',
          topics: topics.map((t: Record<string, string | boolean>, i: number) => ({
            id: t.id,
            title: t.title,
            duration: t.duration || '—',
            hasQuiz: t.hasQuiz || false,
            hasPreview: i === 0,
            isLocked: i > 0 && !c.isEnrolled,
          })),
        };
        setCurriculum([section]);
      }

      setReviews(
        reviewsData.map((r: { id: string; student?: { fullName?: string; avatarUrl?: string }; rating: number; createdAt: string; comment?: string; helpfulCount?: number }) => ({
          id: r.id,
          userName: r.student?.fullName || 'Foydalanuvchi',
          userImage: r.student?.avatarUrl || '',
          userImageAlt: r.student?.fullName || '',
          rating: r.rating,
          date: new Date(r.createdAt).toLocaleDateString('uz-UZ'),
          comment: r.comment || '',
          helpful: r.helpfulCount || 0,
        }))
      );

      setIsEnrolled(!!c.isEnrolled);
    } catch (err) {
      console.error('Kurs yuklanmadi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handlePurchase = async () => {
    if (!course) return;
    if (isEnrolled) {
      router.push(`/learning-interface?courseId=${course.id}`);
      return;
    }

    // Bepul kurs — to'g'ridan-to'g'ri enroll
    if (course.pricing.uzs === 0) {
      setIsPurchasing(true);
      try {
        const res = await fetch(`/api/courses/${course.id}/enroll`, {
          method: 'POST',
          credentials: 'include',
        });
        if (res.status === 401) {
          router.push(`/login?redirect=/course-details?courseId=${course.id}`);
          return;
        }
        if (res.ok) {
          setIsEnrolled(true);
          router.push(`/learning-interface?courseId=${course.id}`);
        }
      } catch (err) {
        console.error('Enroll xato:', err);
      } finally {
        setIsPurchasing(false);
      }
      return;
    }

    // Pulli kurs — payment sahifasiga
    const courseData = {
      id: course.id,
      title: course.title,
      price_uzs: course.pricing.uzs,
      price_usd: course.pricing.usd,
      cover_image: course.coverImage,
      instructor_name: course.instructor.name,
      instructor_image: course.instructor.image,
    };
    router.push(`/payment-method-selection?courseId=${course.id}&courseData=${encodeURIComponent(JSON.stringify(courseData))}`);
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseHeroSection
          course={course}
          onPurchase={handlePurchase}
          isPurchasing={isPurchasing}
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-md shadow-warm p-2">
              <div className="flex flex-wrap gap-2">
                {(['overview', 'curriculum', 'reviews', 'instructor'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-md font-medium transition-smooth ${
                      activeTab === tab
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {tab === 'overview' && t('courses.overview')}
                    {tab === 'curriculum' && t('courses.curriculum')}
                    {tab === 'reviews' && t('courses.reviews')}
                    {tab === 'instructor' && t('courses.instructor')}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">{t('courses.aboutCourse')}</h2>
                  <p className="text-foreground leading-relaxed">{course.description}</p>
                </div>
                {course.hasCertificate && (
                  <div className="bg-accent bg-opacity-10 border border-accent rounded-md p-4 flex items-start space-x-3">
                    <Icon name="AcademicCapIcon" size={24} className="text-accent flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{t('courses.certificate')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('courses.certificateDesc')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'curriculum' && (
              curriculum.length > 0 ? (
                <CourseCurriculum
                  sections={curriculum}
                  expandedSections={expandedSections}
                  onToggleSection={toggleSection}
                />
              ) : (
                <div className="bg-card rounded-md shadow-warm p-8 text-center text-muted-foreground">
                  {t('courses.noCurriculum')}
                </div>
              )
            )}

            {activeTab === 'reviews' && (
              <CourseReviews
                reviews={reviews}
                averageRating={course.rating}
                totalReviews={course.reviewCount}
              />
            )}

            {activeTab === 'instructor' && (
              <InstructorBio instructor={course.instructor} />
            )}
          </div>

          <div className="lg:col-span-1">
            <CourseSidebar
              course={course}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
            />
          </div>
        </div>

        <RelatedCourses currentCourseId={course.id} />
      </div>
    </div>
  );
};

export default CourseDetailsInteractive;
