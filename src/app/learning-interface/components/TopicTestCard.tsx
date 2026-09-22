'use client';

/**
 * TopicTestCard — dars ko'rinishining asosiy maydonida mavzuning published
 * testlarini ko'rsatadi. Topic-scoped, o'zi fetch qiladi (ResourceDownloads andozasi).
 * Test bo'lmasa hech narsa render qilmaydi.
 */
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface TopicTest {
  id: string;
  title: string;
  description: string | null;
  questionCount: number;
  passingScore: number;
  timeLimitSec: number | null;
  allowedAttempts: number;
  attemptsUsed: number;
  bestAttempt: { percentage: number; passed: boolean } | null;
}

interface TopicTestCardProps {
  topicId: string;
  courseId?: string;
}

const TopicTestCard = ({ topicId }: TopicTestCardProps) => {
  const { t } = useI18n();
  const router = useRouter();
  const [tests, setTests] = useState<TopicTest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!topicId) {
      setTests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/tests`, { credentials: 'include' });
      if (!res.ok) {
        setTests([]);
        return;
      }
      const data = await res.json();
      setTests(data.tests || []);
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="h-28 rounded-xl bg-muted/40 animate-pulse" aria-busy="true" />;
  }
  if (tests.length === 0) return null;

  return (
    <div className="space-y-4">
      {tests.map((tst) => {
        const limitReached = tst.allowedAttempts > 0 && tst.attemptsUsed >= tst.allowedAttempts;
        const timeLabel =
          tst.timeLimitSec && tst.timeLimitSec > 0
            ? `${Math.round(tst.timeLimitSec / 60)} ${t('learning.testTimeMinutes')}`
            : t('learning.testNoLimit');
        const attemptsLabel =
          tst.allowedAttempts > 0
            ? `${tst.attemptsUsed}/${tst.allowedAttempts}`
            : t('learning.testUnlimited');

        return (
          <div
            key={tst.id}
            className="rounded-xl border border-border bg-card shadow-warm p-5"
          >
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                <Icon name="ClipboardDocumentCheckIcon" size={26} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-0.5">
                      {t('learning.testSectionTitle')}
                    </p>
                    <h3 className="font-heading font-semibold text-foreground truncate">
                      {tst.title}
                    </h3>
                  </div>
                  {tst.bestAttempt && (
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        tst.bestAttempt.passed
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/15 text-warning-foreground dark:text-warning'
                      }`}
                    >
                      <Icon
                        name={tst.bestAttempt.passed ? 'CheckCircleIcon' : 'ExclamationCircleIcon'}
                        size={13}
                      />
                      {t('learning.testBest')}: {Math.round(tst.bestAttempt.percentage)}%
                    </span>
                  )}
                </div>

                {tst.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{tst.description}</p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="QuestionMarkCircleIcon" size={14} />
                    {tst.questionCount} {t('learning.testQuestionsUnit')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="CheckBadgeIcon" size={14} />
                    {t('learning.testPassing')}: {tst.passingScore}%
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="ClockIcon" size={14} />
                    {timeLabel}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="ArrowPathIcon" size={14} />
                    {attemptsLabel}
                  </span>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={limitReached}
                    onClick={() => router.push(`/tests/${tst.id}/take`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon name={tst.bestAttempt ? 'ArrowPathIcon' : 'PlayCircleIcon'} size={18} />
                    {tst.bestAttempt ? t('learning.testRetake') : t('learning.testStart')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TopicTestCard;
