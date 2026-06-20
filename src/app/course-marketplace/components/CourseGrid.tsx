'use client';

import CourseCard from './CourseCard';
import { useI18n } from '@/contexts/I18nContext';

interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorImage: string;
  instructorImageAlt: string;
  coverImage: string;
  coverImageAlt: string;
  rating: number;
  reviewCount: number;
  price: number;
  currency: string;
  enrollmentCount: number;
  difficulty: string;
  language: string;
  category: string;
}

interface CourseGridProps {
  courses: Course[];
  onWishlistToggle: (courseId: string) => void;
  wishlistedCourses: string[];
}

const CourseGrid = ({ courses, onWishlistToggle, wishlistedCourses }: CourseGridProps) => {
  const { t } = useI18n();

  if (courses.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" className="text-muted-foreground" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" className="text-muted-foreground" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="text-xl font-heading font-semibold">{t('courses.noCoursesFound')}</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {t('courses.tryOtherFilter')}
        </p>
      </div>
    );
  }

  return (
    <>
      {courses.map((course) => (
        <CourseCard
          key={course.id}
          course={course}
          onWishlistToggle={onWishlistToggle}
          isWishlisted={wishlistedCourses.includes(course.id)}
        />
      ))}
    </>
  );
};

export default CourseGrid;