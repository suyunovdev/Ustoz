'use client';

import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import type { DashboardEnrollment } from '@/types/dashboard.types';

interface ContinueLearningHeroProps {
  enrollment: DashboardEnrollment;
}

const ContinueLearningHero = ({ enrollment }: ContinueLearningHeroProps) => {
  const { t } = useI18n();
  const { course, progress, nextTopic, completedTopicsCount, totalTopics } = enrollment;

  // Qolgan vaqt taxmini: har topic = totalDuration (soat) * 60 / totalTopics → daqiqa
  const remainingTopics = Math.max(0, totalTopics - completedTopicsCount);
  const minutesPerTopic =
    totalTopics > 0 ? Math.round((course.totalDuration * 60) / totalTopics) : 0;
  const remainingMinutes = remainingTopics * minutesPerTopic;

  const isNotStarted = progress === 0;
  const href = nextTopic
    ? `/learning-interface?courseId=${enrollment.courseId}&topicId=${nextTopic.id}`
    : `/learning-interface?courseId=${enrollment.courseId}`;

  const ctaLabel = isNotStarted ? t('student.start') : t('student.continueBtn');
  const labelText = isNotStarted ? t('student.startUpper') : t('student.continueUpper');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-secondary p-[2px] group transition-all hover:shadow-warm-xl">
      <div className="relative rounded-2xl bg-card overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Chap: Cover */}
          <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto md:min-h-[260px] flex-shrink-0">
            {course.coverImage ? (
              <AppImage
                src={course.coverImage}
                alt={course.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary flex items-center justify-center">
                <Icon name="BookOpenIcon" size={64} className="text-primary-foreground/40" />
              </div>
            )}
            {/* Bottom-up gradient (image ustida o'qish uchun) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent md:bg-gradient-to-r md:from-card md:via-transparent md:to-transparent" />

            {/* Progress badge — cover ustida */}
            <div className="absolute top-3 right-3 bg-card/95 backdrop-blur px-3 py-1.5 rounded-full">
              <span className="text-sm font-data font-bold text-foreground">{progress}%</span>
            </div>
          </div>

          {/* O'ng: Content */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center gap-4">
            {/* Label */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold tracking-wider w-fit">
              <Icon name="PlayCircleIcon" size={14} variant="solid" />
              {labelText}
            </div>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground leading-tight line-clamp-2">
              {course.title}
            </h2>

            {/* Next topic */}
            {nextTopic ? (
              <p className="text-sm md:text-base text-muted-foreground">
                {t('student.next')}:{' '}
                <span className="text-foreground font-medium">{nextTopic.title}</span>
              </p>
            ) : (
              <p className="text-sm md:text-base text-muted-foreground">
                <span className="text-foreground font-medium">{course.teacherName}</span>
              </p>
            )}

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Meta */}
              <div className="flex items-center gap-x-3 gap-y-1 text-sm text-muted-foreground flex-wrap">
                <span className="font-medium text-foreground">{progress}% {t('student.completed')}</span>
                <span className="text-muted-foreground/40">·</span>
                <span>
                  {completedTopicsCount} / {totalTopics} {t('student.topics')}
                </span>
                {remainingMinutes > 0 && (
                  <>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="flex items-center gap-1">
                      <Icon name="ClockIcon" size={14} />
                      {remainingMinutes < 60
                        ? `${remainingMinutes} ${t('student.minLeft')}`
                        : `${Math.round(remainingMinutes / 60)} ${t('student.hoursLeft')}`}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* CTA */}
            <Link
              href={href}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-warm hover:shadow-warm-lg hover:-translate-y-0.5 w-full sm:w-auto sm:self-start"
            >
              {ctaLabel}
              <Icon name="ArrowRightIcon" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContinueLearningHero;
