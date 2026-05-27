import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import type { DashboardEnrollment } from '@/types/dashboard.types';

interface CourseCardProps {
  enrollment: DashboardEnrollment;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1516101922849-2bf0be616449';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

const CourseCard = ({ enrollment }: CourseCardProps) => {
  const {
    courseId,
    progress,
    completedTopicsCount,
    totalTopics,
    nextTopic,
    isCompleted,
    completedAt,
    enrolledAt,
    course,
  } = enrollment;

  // CTA
  let ctaHref = `/learning-interface?courseId=${courseId}`;
  let ctaLabel = "Davom etish";
  let ctaClass = 'bg-secondary text-secondary-foreground hover:bg-secondary/90';

  if (isCompleted) {
    ctaHref = '/certificates';
    ctaLabel = "Sertifikat";
    ctaClass = 'bg-success text-success-foreground hover:bg-success/90';
  } else if (nextTopic) {
    ctaHref = `/learning-interface?courseId=${courseId}&topicId=${nextTopic.id}`;
    ctaLabel = progress === 0 ? "Boshlash" : "Davom etish";
  }

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
        {isCompleted && (
          <div className="absolute top-2 right-2 bg-success px-3 py-1 rounded-full flex items-center space-x-1">
            <Icon name="CheckCircleIcon" size={16} className="text-success-foreground" variant="solid" />
            <span className="text-xs font-medium text-success-foreground">Tugatildi</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-1 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">{course.teacherName}</p>

        {/* Progress section */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{completedTopicsCount} / {totalTopics} mavzu · {progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Next topic teaser (faqat in-progress holatlarda) */}
          {!isCompleted && nextTopic && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1" title={`Keyingi: ${nextTopic.title}`}>
              Keyingi: <span className="text-foreground font-medium">{nextTopic.title}</span>
            </p>
          )}
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          {isCompleted ? (
            <div className="flex items-center space-x-1 text-success">
              <Icon name="CheckCircleIcon" size={14} variant="solid" />
              <span>Tugatildi: {formatDate(completedAt)}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1">
              <Icon name="ClockIcon" size={14} />
              <span>Yozilgan: {formatDate(enrolledAt)}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href={ctaHref}
          className={`flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-md transition-smooth font-medium ${ctaClass}`}
        >
          <span>{ctaLabel}</span>
          <Icon name={isCompleted ? 'AcademicCapIcon' : 'ArrowRightIcon'} size={18} />
        </Link>
      </div>
    </div>
  );
};

export default CourseCard;
