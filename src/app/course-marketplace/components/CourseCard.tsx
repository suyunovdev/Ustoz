'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { getSubjectLabel, getAudienceLabel } from '@/lib/data/subject-labels';
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
  targetAudience?: string;
  subjectCategory?: string;
  gradeLevel?: number;
}

interface CourseCardProps {
  course: Course;
  onWishlistToggle: (courseId: string) => void;
  isWishlisted: boolean;
}

const CourseCard = ({ course, onWishlistToggle, isWishlisted }: CourseCardProps) => {
  const { t } = useI18n();
  const [imageLoaded, setImageLoaded] = useState(false);

  const getSubjectDisplay = () => {
    if (!course.subjectCategory) return null;
    const subjectLabel = getSubjectLabel(course.subjectCategory);
    if (course.gradeLevel) {
      return `${course.gradeLevel}-sinf ${subjectLabel}`;
    }
    return subjectLabel;
  };

  const getAudienceDisplay = () => {
    if (!course.targetAudience) return null;
    return getAudienceLabel(course.targetAudience);
  };

  const subjectDisplay = getSubjectDisplay();
  const audienceDisplay = getAudienceDisplay();

  return (
    <div className="bg-card rounded-md shadow-warm hover:shadow-warm-lg transition-smooth overflow-hidden group">
      {/* Course Image */}
      <div className="relative h-48 overflow-hidden bg-muted">
        <AppImage
          src={course.coverImage}
          alt={course.coverImageAlt}
          className={`w-full h-full object-cover group-hover:scale-105 transition-smooth ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon name="PhotoIcon" size={48} className="text-muted-foreground opacity-50" />
          </div>
        )}
        
        {/* Wishlist Button */}
        <button
          onClick={() => onWishlistToggle(course.id)}
          className="absolute top-3 right-3 p-2 bg-card rounded-full shadow-warm-md hover:scale-110 transition-smooth"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Icon
            name="HeartIcon"
            size={20}
            variant={isWishlisted ? 'solid' : 'outline'}
            className={isWishlisted ? 'text-error' : 'text-foreground'}
          />
        </button>

        {/* Difficulty Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1 bg-card rounded-full text-xs font-medium shadow-warm">
          {course.difficulty}
        </div>
      </div>

      {/* Course Info */}
      <div className="p-4 space-y-3">
        {/* Category and Subject */}
        <div className="flex items-center flex-wrap gap-2">
          {subjectDisplay && (
            <span className="px-2 py-1 bg-primary bg-opacity-10 text-primary text-xs font-medium rounded">
              {subjectDisplay}
            </span>
          )}
          {audienceDisplay && (
            <span className="px-2 py-1 bg-secondary bg-opacity-10 text-secondary text-xs font-medium rounded">
              {audienceDisplay}
            </span>
          )}
          <span className="text-xs text-muted-foreground">{course.language}</span>
        </div>

        {/* Title */}
        <h3 className="font-heading font-semibold text-lg line-clamp-2 group-hover:text-primary transition-smooth">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
            <AppImage
              src={course.instructorImage}
              alt={course.instructorImageAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-sm text-muted-foreground">{course.instructor}</span>
        </div>

        {/* Rating & Enrollment */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Icon name="StarIcon" size={16} variant="solid" className="text-accent" />
            <span className="text-sm font-data font-medium">{course.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({course.reviewCount})</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Icon name="UserGroupIcon" size={16} />
            <span>{course.enrollmentCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="space-y-0.5">
            <div className="text-2xl font-heading font-bold text-primary">
              {course.price === 0 ? t('courses.free') : `${course.price.toLocaleString()} ${course.currency}`}
            </div>
          </div>
          <Link
            href={`/course-details?courseId=${course.id}`}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-secondary transition-smooth"
          >
            {t('courses.viewDetails')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;