// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

import Icon from '@/components/ui/AppIcon';
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
      const supabase = createClient();

      // Load course details
      const { data: c, error } = await supabase
        .from('courses')
        .select(`
          id, title, description, cover_image, price_usd, price_uzs,
          rating, review_count, enrollment_count, difficulty_level,
          language, total_duration, is_published, created_at,
          user_profiles!teacher_id (
            id, full_name, avatar_url
          )
        `)
        .eq('id', id)
        .single();

      if (error || !c) {
        router.push('/course-marketplace');
        return;
      }

      // Load instructor's course count
      const { count: coursesCount } = await supabase
        .from('courses')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', (c.user_profiles as any)?.id)
        .eq('is_published', true);

      const mapped: CourseDetails = {
        id: c.id,
        title: c.title,
        subtitle: c.description?.split('.')[0] || c.title,
        coverImage: c.cover_image || 'https://images.unsplash.com/photo-1516101922849-2bf0be616449',
        coverImageAlt: `${c.title} kursi`,
        instructor: {
          name: (c.user_profiles as any)?.full_name || 'Ustoz',
          image: (c.user_profiles as any)?.avatar_url || 'https://img.rocket.new/generatedImages/rocket_gen_img_1f9f88657-1763292682460.png',
          imageAlt: `${(c.user_profiles as any)?.full_name || 'Ustoz'} rasmi`,
          rating: Number(c.rating) || 0,
          studentsCount: c.enrollment_count || 0,
          coursesCount: coursesCount || 0,
          bio: `${(c.user_profiles as any)?.full_name || 'Ustoz'} — tajribali o'qituvchi.`,
        },
        pricing: {
          usd: Number(c.price_usd) || 0,
          uzs: Number(c.price_uzs) || 0,
        },
        rating: Number(c.rating) || 0,
        reviewCount: c.review_count || 0,
        enrollmentCount: c.enrollment_count || 0,
        description: c.description || '',
        learningObjectives: [],
        prerequisites: [],
        hasCertificate: true,
        language: c.language || 'uz',
        lastUpdated: c.created_at ? new Date(c.created_at).toLocaleDateString('uz-UZ') : '',
        totalDuration: `${c.total_duration || 0} soat`,
        level: c.difficulty_level || 'Boshlang\'ich',
      };
      setCourse(mapped);

      // Load curriculum (course_topics grouped by section)
      const { data: topics } = await supabase
        .from('course_topics')
        .select('id, title, description, topic_order, has_quiz')
        .eq('course_id', id)
        .order('topic_order', { ascending: true });

      if (topics && topics.length > 0) {
        // Group into one section if no section data
        const section: CurriculumSection = {
          id: 'section-1',
          title: 'Kurs Mavzulari',
          topics: topics.map((t: any, i: number) => ({
            id: t.id,
            title: t.title,
            duration: '—',
            hasQuiz: t.has_quiz || false,
            hasPreview: i === 0,
            isLocked: i > 0,
          })),
        };
        setCurriculum([section]);
      }

      // Check enrollment
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('id')
          .eq('student_id', user.id)
          .eq('course_id', id)
          .single();
        setIsEnrolled(!!enrollment);
      }

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

  const handlePurchase = () => {
    if (!course) return;
    if (isEnrolled) {
      router.push(`/learning-interface?courseId=${course.id}`);
      return;
    }
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
        <div className="animate-pulse text-muted-foreground">Yuklanmoqda...</div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CourseHeroSection
          course={{ ...course, isEnrolled }}
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
                    {tab === 'overview' && "Umumiy ma'lumot"}
                    {tab === 'curriculum' && "O'quv dasturi"}
                    {tab === 'reviews' && 'Sharhlar'}
                    {tab === 'instructor' && "O'qituvchi"}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-foreground mb-4">Kurs haqida</h2>
                  <p className="text-foreground leading-relaxed">{course.description}</p>
                </div>
                {course.hasCertificate && (
                  <div className="bg-accent bg-opacity-10 border border-accent rounded-md p-4 flex items-start space-x-3">
                    <Icon name="AcademicCapIcon" size={24} className="text-accent flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">Sertifikat</h4>
                      <p className="text-sm text-muted-foreground">
                        Kursni muvaffaqiyatli tugatganingizdan so'ng rasmiy sertifikat olasiz.
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
                  O'quv dasturi hali qo'shilmagan
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
              course={{ ...course, isEnrolled }}
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
