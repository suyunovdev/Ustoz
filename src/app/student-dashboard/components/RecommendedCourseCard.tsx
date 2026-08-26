import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatNumber } from '@/lib/i18n/format';
import { getDifficultyLabel } from '@/lib/data/subject-labels';
import type { RecommendedCourse, RecommendReason } from '@/types/recommendation.types';

interface RecommendedCourseCardProps {
  course: RecommendedCourse;
}

const REASON_BADGES: Record<
  RecommendReason,
  { labelKey: string; icon: string; classes: string }
> = {
  category_match: {
    labelKey: 'student.reasonCategoryMatch',
    icon: '🎯',
    classes: 'bg-primary/10 text-primary dark:bg-primary/20',
  },
  popular: {
    labelKey: 'student.reasonPopular',
    icon: '🌟',
    classes: 'bg-warning/10 text-warning dark:bg-warning/20',
  },
  new_arrival: {
    labelKey: 'student.reasonNewArrival',
    icon: '✨',
    classes: 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  },
  top_rated: {
    labelKey: 'student.reasonTopRated',
    icon: '🏆',
    classes: 'bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  },
};

const RecommendedCourseCard = ({ course }: RecommendedCourseCardProps) => {
  const { locale, t } = useI18n();
  const badge = REASON_BADGES[course.recommendReason];
  const badgeLabel = t(badge.labelKey);
  // Davomiylik bo'lsa soat, aks holda qiyinlik darajasi (mos ikonka bilan)
  const hasDuration = course.totalDuration > 0;
  const metaIcon = hasDuration ? 'ClockIcon' : 'ChartBarIcon';
  const metaLabel = hasDuration
    ? t('student.durationHours', { count: course.totalDuration })
    : getDifficultyLabel(course.difficultyLevel);

  return (
    <div className="bg-card rounded-md shadow-warm hover:shadow-warm-md transition-smooth overflow-hidden group">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/80 to-secondary">
        {course.coverImage ? (
          <AppImage
            src={course.coverImage}
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
          title={badgeLabel}
        >
          <span aria-hidden="true">{badge.icon}</span>
          <span className="hidden sm:inline">{badgeLabel}</span>
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
            <span className="font-data">{formatNumber(course.enrollmentCount, locale)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Icon name={metaIcon} size={16} />
            <span>{metaLabel}</span>
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
              ? t('student.free')
              : formatCurrency(course.priceUzs, locale, 'UZS')}
          </span>
          <Link
            href={`/course-details?courseId=${course.id}`}
            className="flex items-center space-x-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth"
          >
            <span className="font-medium text-sm">{t('student.view')}</span>
            <Icon name="ArrowRightIcon" size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecommendedCourseCard;
