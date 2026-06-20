'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface StreakAlertProps {
  streak: { current: number; activeToday: boolean };
  mostRecentEnrollment?: {
    courseId: string;
    nextTopicId?: string | null;
  };
}

const STORAGE_KEY = 'ustoz_streak_alert_dismissed';

const StreakAlert = ({ streak, mostRecentEnrollment }: StreakAlertProps) => {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState(true); // SSR-safe: avval hidden

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      setDismissed(false);
    }
  }, []);

  // Faqat aniq holatda ko'rsatamiz
  if (dismissed) return null;
  if (streak.current === 0) return null;
  if (streak.activeToday) return null;

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
    setDismissed(true);
  };

  const resumeHref = mostRecentEnrollment
    ? mostRecentEnrollment.nextTopicId
      ? `/learning-interface?courseId=${mostRecentEnrollment.courseId}&topicId=${mostRecentEnrollment.nextTopicId}`
      : `/learning-interface?courseId=${mostRecentEnrollment.courseId}`
    : '/course-marketplace';

  return (
    <div className="bg-warning/10 dark:bg-warning/15 border-l-4 border-warning rounded-md p-4 flex items-center gap-3">
      <span className="text-2xl flex-shrink-0" aria-hidden="true">🔥</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{t('student.keepStreak')}</p>
        <p className="text-sm text-muted-foreground">
          {t('student.notStudiedToday')}{' '}
          <span className="font-medium text-foreground">{streak.current} {t('student.dayStreak')}</span> {t('student.streakAtRisk')}
        </p>
      </div>

      <Link
        href={resumeHref}
        className="hidden sm:inline-flex items-center gap-1 px-4 py-2 bg-warning text-warning-foreground rounded-md text-sm font-medium hover:bg-warning/90 transition-colors flex-shrink-0"
      >
        {t('student.continueBtn')}
        <Icon name="ArrowRightIcon" size={16} />
      </Link>

      <button
        onClick={handleDismiss}
        aria-label={t('common.close')}
        className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-colors flex-shrink-0"
      >
        <Icon name="XMarkIcon" size={20} />
      </button>
    </div>
  );
};

export default StreakAlert;
