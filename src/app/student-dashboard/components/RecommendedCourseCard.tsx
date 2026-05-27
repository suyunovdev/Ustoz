import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import type { RecommendedCourse, RecommendReason } from '@/types/recommendation.types';

interface RecommendedCourseCardProps {
  course: RecommendedCourse;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1516101922849-2bf0be616449';

const REASON_BADGES: Record<
  RecommendReason,
  { label: string; icon: string; classes: string }
> = {
  category_match: {
    label: 'Sizning kategoriyangiz',
    icon: '🎯',
    classes: 'bg-primary/10 text-primary dark:bg-primary/20',
  },
  popular: {
    label: 'Mashhur',
    icon: '🌟',
    classes: 'bg-warning/10 text-warning dark:bg-warning/20',
  },
  new_arrival: {
    label: 'Yangi',
    icon: '✨',
    classes: 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  },
  top_rated: {
    label: 'Top reytingli',
    icon: '🏆',
    classes: 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  },
};

const RecommendedCourseCard = ({ course }: RecommendedCourseCardProps) => {
  const badge = REASON_BADGES[course.recommendReason];
  const duration =
    course.totalDuration > 0 ? `${course.totalDuration} soat` : course.difficultyLevel || '—';

  return (
    <div className="bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth overflow-hidden group">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/80 to-secondary">
        {course.coverImage ? (
          <AppImage
            src={course.coverImage || DEFAULT_COVER}
            alt={`${course.title} kursi`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="BookOpenIcon" size={56} className="text-primary-foreground/40" />
          </div>
        )}

        {/* Reason badge */}
        <div
          className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.classes}`}
          title={badge.label}
        >
          <span aria-hidden="true">{badge.icon}</span>
          <span className="hidden sm:inline">{badge.label}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{course.teacherName}</p>

        {/* Stats row */}
        <div className="flex items-center space-x-4 mb-3 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Icon name="StarIcon" size={16} className="text-accent" variant="solid" />
            <span className="font-data">{course.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="UserGroupIcon" size={16} />
            <span className="font-data">{course.enrollmentCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name="ClockIcon" size={16} />
            <span>{duration}</span>
          </div>
        </div>

        {/* Category */}
        {course.category && (
          <div className="mb-3">
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {course.category.name}
            </span>
          </div>
        )}

        {/* Footer: price + CTA */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-heading font-bold text-primary">
            {course.priceUzs === 0
              ? 'Bepul'
              : `${course.priceUzs.toLocaleString('uz-UZ')} UZS`}
          </span>
          <Link
            href={`/course-details?courseId=${course.id}`}
            className="flex items-center space-x-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
          >
            <span className="font-medium text-sm">Ko'rish</span>
            <Icon name="ArrowRightIcon" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecommendedCourseCard;
