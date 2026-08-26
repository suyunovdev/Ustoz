import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatNumber } from '@/lib/i18n/format';
import type { CourseCardData } from './types';

interface InstructorBioProps {
  instructor: {
    name: string;
    image: string;
    imageAlt: string;
    rating: number;
    studentsCount: number;
    coursesCount: number;
    bio: string;
  };
  otherCourses: CourseCardData[];
}

const InstructorBio = ({ instructor, otherCourses }: InstructorBioProps) => {
  const { t, locale } = useI18n();
  return (
    <div className="bg-card rounded-md shadow-warm p-6 space-y-6">
      <h2 className="text-2xl font-heading font-bold text-foreground">{t('courseDetails.aboutInstructor')}</h2>

      {/* Instructor Profile */}
      <div className="flex items-start space-x-4">
        <Avatar src={instructor.image} name={instructor.name} size={96} />
        <div className="flex-1">
          <h3 className="text-xl font-heading font-semibold text-foreground mb-2">
            {instructor.name}
          </h3>
          <div className="space-y-2">
            {instructor.rating > 0 && (
              <div className="flex items-center space-x-2">
                <Icon name="StarIcon" size={16} variant="solid" className="text-accent" />
                <span className="text-sm font-data">{instructor.rating.toFixed(1)} {t('courseDetails.averageRating')}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Icon name="UserGroupIcon" size={16} className="text-primary" />
              <span className="text-sm">{formatNumber(instructor.studentsCount, locale)} {t('courseDetails.studentsSuffix')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Icon name="BookOpenIcon" size={16} className="text-primary" />
              <span className="text-sm">{formatNumber(instructor.coursesCount, locale)} {t('courseDetails.courses')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <h4 className="font-semibold text-foreground mb-2">{t('courseDetails.biography')}</h4>
        <p className="text-foreground leading-relaxed whitespace-pre-line">{instructor.bio}</p>
      </div>

      {/* Other Courses — haqiqiy ma'lumot */}
      {otherCourses.length > 0 && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">{t('courseDetails.otherCourses')}</h4>
          <div className="space-y-3">
            {otherCourses.map((course) => (
              <Link
                key={course.id}
                href={`/course-details?courseId=${course.id}`}
                className="block p-3 bg-muted rounded-md hover:bg-muted/80 transition-smooth"
              >
                <h5 className="font-medium text-foreground mb-1 line-clamp-1">{course.title}</h5>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  {course.rating > 0 && (
                    <div className="flex items-center space-x-1">
                      <Icon name="StarIcon" size={12} variant="solid" className="text-accent" />
                      <span>{course.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Icon name="UserGroupIcon" size={12} />
                    <span>{formatNumber(course.enrollmentCount, locale)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorBio;
