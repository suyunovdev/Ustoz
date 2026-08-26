import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatNumber } from '@/lib/i18n/format';
import { getDifficultyLabel } from '@/lib/data/subject-labels';
import type { CourseCardData } from './types';

interface RelatedCoursesProps {
  courses: CourseCardData[];
}

const RelatedCourses = ({ courses }: RelatedCoursesProps) => {
  const { t, locale } = useI18n();

  if (courses.length === 0) return null;

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-heading font-bold text-foreground mb-6">{t('courseDetails.relatedCourses')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => {
          const priceUzs = Number(course.priceUzs) || 0;
          return (
            <Link
              key={course.id}
              href={`/course-details?courseId=${course.id}`}
              className="bg-card rounded-md shadow-warm hover:shadow-warm-lg transition-smooth overflow-hidden group"
            >
              <div className="relative h-40 overflow-hidden bg-muted">
                {course.coverImage ? (
                  <AppImage
                    src={course.coverImage}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon name="PhotoIcon" size={40} className="text-muted-foreground opacity-40" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-card/90 rounded-full text-xs font-medium shadow-warm">
                  {getDifficultyLabel(course.difficultyLevel)}
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-heading font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-smooth">
                  {course.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">{course.teacherName}</p>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1">
                    <Icon name="StarIcon" size={14} variant="solid" className="text-accent" />
                    <span className="text-sm font-data">{course.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({formatNumber(course.reviewCount, locale)})</span>
                  </div>
                  <span className="text-lg font-heading font-bold text-primary">
                    {priceUzs > 0 ? formatCurrency(priceUzs, locale, 'UZS') : t('courses.free')}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RelatedCourses;
