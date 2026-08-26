'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { optimizeImageUrl } from '@/lib/imageUrl';
import { SkeletonDetail } from '@/components/ui/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate } from '@/lib/i18n/format';
import { getDifficultyLabel, getLanguageLabel, getSubjectLabel } from '@/lib/data/subject-labels';
import { sumDurations } from '@/lib/duration';
import type { CourseCardData, RatingDistribution } from './types';
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
  hasCertificate: boolean;
  language: string;
  lastUpdated: string;
  totalDuration: string;
  level: string;
  subject: string;
  lessonCount: number;
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
  rawDate: string;
  comment: string;
  helpful: number;
}

const CourseDetailsInteractive = () => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('courseId');

  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews' | 'instructor'>('overview');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);
  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumSection[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<CourseCardData[]>([]);
  const [instructorCourses, setInstructorCourses] = useState<CourseCardData[]>([]);
  const [loadError, setLoadError] = useState(false);

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
    setLoadError(false);
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

      // Davomiylik — mavzular yig'indisidan (course.totalDuration ko'pincha 0)
      const durationFromTopics = sumDurations(
        topics.map((tp: Record<string, string>) => tp.duration),
      );

      const mapped: CourseDetails = {
        id: c.id,
        title: c.title,
        subtitle: c.description?.split('.')[0]?.trim() || '',
        coverImage: optimizeImageUrl(c.coverImage || 'https://images.unsplash.com/photo-1516101922849-2bf0be616449', 800),
        coverImageAlt: `${c.title} ${t('courseDetails.courseImageAlt')}`,
        instructor: {
          name: teacher.fullName || t('courseDetails.defaultInstructor'),
          image: teacher.avatarUrl || '',
          imageAlt: `${teacher.fullName || t('courseDetails.defaultInstructor')} ${t('courseDetails.instructorImageAlt')}`,
          rating: Number(c.rating) || 0,
          studentsCount: c.enrollmentCount || 0,
          coursesCount: c.instructorCourseCount || 0,
          bio: teacher.bio || `${teacher.fullName || t('courseDetails.defaultInstructor')} ${t('courseDetails.defaultBioSuffix')}`,
        },
        pricing: {
          usd: Number(c.priceUsd) || 0,
          uzs: Number(c.priceUzs) || 0,
        },
        rating: Number(c.rating) || 0,
        reviewCount: c.reviewCount || 0,
        enrollmentCount: c.enrollmentCount || 0,
        description: c.description || '',
        hasCertificate: true,
        language: getLanguageLabel(c.language),
        // Xom ISO — formatlashni komponentlar bajaradi (ikki marta formatlamaslik uchun)
        lastUpdated: c.createdAt || '',
        totalDuration: durationFromTopics,
        level: getDifficultyLabel(c.difficultyLevel),
        subject: getSubjectLabel(c.subjectCategory),
        lessonCount: topics.length,
      };
      setCourse(mapped);

      if (topics.length > 0) {
        const section: CurriculumSection = {
          id: 'section-1',
          title: t('courseDetails.courseTopics'),
          topics: topics.map((tp: Record<string, string | boolean>) => ({
            id: tp.id as string,
            title: tp.title as string,
            duration: (tp.duration as string) || '—',
            hasQuiz: Boolean(tp.hasQuiz),
            hasPreview: Boolean(tp.isFreePreview),
            isLocked: !c.isEnrolled && !tp.isFreePreview,
          })),
        };
        setCurriculum([section]);
      }

      setReviews(
        reviewsData.map((r: { id: string; student?: { fullName?: string; avatarUrl?: string }; rating: number; createdAt: string; comment?: string; helpfulCount?: number }) => ({
          id: r.id,
          userName: r.student?.fullName || t('courseDetails.anonymousUser'),
          userImage: r.student?.avatarUrl || '',
          userImageAlt: r.student?.fullName || '',
          rating: r.rating,
          date: formatDate(r.createdAt, locale),
          rawDate: r.createdAt,
          comment: r.comment || '',
          helpful: r.helpfulCount || 0,
        }))
      );

      setRatingDistribution(c.ratingDistribution || []);
      setRelatedCourses(c.relatedCourses || []);
      setInstructorCourses(c.instructorCourses || []);
      setIsEnrolled(!!c.isEnrolled);
      setDiscountPct(Number(c.subscriberDiscountPct) || 0);
    } catch (err) {
      console.error('Kurs yuklanmadi:', err);
      setLoadError(true);
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

    // Bepul kurs YOKI all-access obuna (100%) — to'g'ridan-to'g'ri enroll
    if (course.pricing.uzs === 0 || discountPct >= 100) {
      setIsPurchasing(true);
      try {
        const res = await fetch(`/api/courses/${course.id}/enroll`, {
          method: 'POST',
          credentials: 'include',
        });
        if (res.status === 401) {
          router.push(`/login?redirect=${encodeURIComponent(`/course-details?courseId=${course.id}`)}`);
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

    // Pulli kurs — obuna chegirmasi qo'llangan narx bilan payment sahifasiga
    const finalUzs =
      discountPct > 0 ? Math.round((course.pricing.uzs * (100 - discountPct)) / 100) : course.pricing.uzs;
    const courseData = {
      id: course.id,
      title: course.title,
      price_uzs: finalUzs,
      price_usd: course.pricing.usd,
      cover_image: course.coverImage,
      instructor_name: course.instructor.name,
      instructor_image: course.instructor.image,
    };
    router.push(`/payment-method-selection?courseId=${course.id}&courseData=${encodeURIComponent(JSON.stringify(courseData))}`);
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SkeletonDetail />
        </div>
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="min-h-screen bg-background py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorState onRetry={() => courseId && loadCourse(courseId)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
          <Link href="/course-marketplace" className="hover:text-primary transition-smooth">
            {t('courseDetails.breadcrumbCourses')}
          </Link>
          <Icon name="ChevronRightIcon" size={14} />
          {course.subject && (
            <>
              <span className="hover:text-primary transition-smooth">{course.subject}</span>
              <Icon name="ChevronRightIcon" size={14} />
            </>
          )}
          <span className="text-foreground font-medium truncate max-w-[50%]">{course.title}</span>
        </nav>

        <CourseHeroSection
          course={course}
          onPurchase={handlePurchase}
          isPurchasing={isPurchasing}
          isEnrolled={isEnrolled}
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
                {/* Kurs xususiyatlari — haqiqiy ma'lumotdan */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: 'BookOpenIcon', label: t('courseDetails.lessons'), value: String(course.lessonCount) },
                    { icon: 'ClockIcon', label: t('courseDetails.duration'), value: course.totalDuration },
                    { icon: 'ChartBarIcon', label: t('courseDetails.level'), value: course.level },
                    { icon: 'LanguageIcon', label: t('courseDetails.language'), value: course.language },
                  ].map((item) => (
                    <div key={item.label} className="flex flex-col items-center text-center gap-1 p-3 rounded-md bg-muted/60">
                      <Icon name={item.icon} size={22} className="text-primary" />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">{t('courses.aboutCourse')}</h2>
                  <p className="text-foreground leading-relaxed whitespace-pre-line">{course.description || t('courseDetails.noDescription')}</p>
                </div>

                {curriculum.length > 0 && (
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-foreground mb-3">{t('courseDetails.whatYouLearn')}</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {curriculum[0].topics.slice(0, 8).map((topic) => (
                        <li key={topic.id} className="flex items-start gap-2 text-sm text-foreground">
                          <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success flex-shrink-0 mt-0.5" />
                          <span>{topic.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.hasCertificate && (
                  <div className="bg-accent/10 border border-accent rounded-md p-4 flex items-start space-x-3">
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
                distribution={ratingDistribution}
              />
            )}

            {activeTab === 'instructor' && (
              <InstructorBio instructor={course.instructor} otherCourses={instructorCourses} />
            )}
          </div>

          <div className="lg:col-span-1">
            <CourseSidebar
              course={course}
              onPurchase={handlePurchase}
              isPurchasing={isPurchasing}
              isEnrolled={isEnrolled}
              discountPct={discountPct}
            />
          </div>
        </div>

        <RelatedCourses courses={relatedCourses} />
      </div>
    </div>
  );
};

export default CourseDetailsInteractive;
