import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import type { DashboardEnrollment } from '@/types/dashboard.types';

interface ContinueLearningCardProps {
  enrollment: DashboardEnrollment;
}

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1516101922849-2bf0be616449';

const ContinueLearningCard = ({ enrollment }: ContinueLearningCardProps) => {
  const {
    courseId,
    progress,
    completedTopicsCount,
    totalTopics,
    nextTopic,
    isCompleted,
    course,
  } = enrollment;

  const isNotStarted = progress === 0;
  const cover = course.coverImage || DEFAULT_COVER;

  // CTA mantig'i
  let ctaHref: string;
  let ctaLabel: string;
  let ctaClass = 'bg-primary text-primary-foreground hover:bg-primary/90';

  if (isCompleted) {
    ctaHref = '/certificates';
    ctaLabel = "Sertifikatni ko'rish";
    ctaClass = 'bg-success text-success-foreground hover:bg-success/90';
  } else if (isNotStarted && nextTopic) {
    ctaHref = `/learning-interface?courseId=${courseId}&topicId=${nextTopic.id}`;
    ctaLabel = 'Boshlash';
  } else if (nextTopic) {
    ctaHref = `/learning-interface?courseId=${courseId}&topicId=${nextTopic.id}`;
    ctaLabel = 'Davom etish';
  } else {
    // Topic'lar hali qo'shilmagan
    ctaHref = `/learning-interface?courseId=${courseId}`;
    ctaLabel = "Kursni ochish";
  }

  return (
    <div className="bg-card rounded-md shadow-warm hover:shadow-warm-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden group">
      {/* Cover */}
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/80 to-secondary">
        {course.coverImage ? (
          <AppImage
            src={cover}
            alt={`${course.title} kursi`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="BookOpenIcon" size={56} className="text-primary-foreground/40" />
          </div>
        )}
        <div className="absolute top-2 right-2 bg-card/95 backdrop-blur px-3 py-1 rounded-full">
          <span className="text-sm font-data font-semibold text-foreground">{progress}%</span>
        </div>
        {isCompleted && (
          <div className="absolute top-2 left-2 bg-success px-2.5 py-1 rounded-full flex items-center space-x-1">
            <Icon name="CheckCircleIcon" size={14} variant="solid" className="text-success-foreground" />
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

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{completedTopicsCount} / {totalTopics} mavzu</span>
            <span className="font-medium">{progress}% tugatildi</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Next topic info */}
        {nextTopic ? (
          <div className="flex items-start space-x-2 mb-4 p-3 bg-muted/60 rounded-md">
            <Icon name="BookOpenIcon" size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Keyingi mavzu:</p>
              <p className="text-sm font-medium text-foreground line-clamp-1">{nextTopic.title}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2 mb-4 p-3 bg-success/10 rounded-md">
            <Icon name="CheckCircleIcon" size={16} variant="solid" className="text-success flex-shrink-0" />
            <p className="text-sm font-medium text-success">Kurs to'liq tugatildi</p>
          </div>
        )}

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

export default ContinueLearningCard;
