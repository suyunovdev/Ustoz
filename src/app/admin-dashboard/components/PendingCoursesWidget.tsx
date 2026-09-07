'use client';

/**
 * Bosh sahifa (overview) uchun kurs moderatsiya navbati — KUTAYOTGAN KURSLAR.
 *
 * Ilgari overview'da faqat material navbati (ModerationQueuePanel, `moderation_queue`
 * jadvali) ko'rsatilardi — u ko'pincha bo'sh, holbuki kutayotgan KURSLAR boshqa tizimda
 * (`course.moderationStatus`) turadi. Natijada admin bosh ekranda ishi borligini
 * ko'rmasdi. Bu widget aynan kurs navbatini (`/api/admin/course-moderation`) ko'rsatadi.
 */
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface PendingCourse {
  id: string;
  title: string;
  teacherName: string;
  topicCount: number;
}

export default function PendingCoursesWidget({ onOpenModeration }: { onOpenModeration?: () => void }) {
  const { t } = useI18n();
  const [courses, setCourses] = useState<PendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/admin/course-moderation?status=submitted', { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCourses(data.courses || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="bg-card rounded-md shadow-warm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-heading font-semibold text-foreground">
          {t('admin.pendingCoursesTitle')}
        </h3>
        {courses.length > 0 && (
          <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">
            {t('admin.pendingCoursesCount', { count: courses.length })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-12 bg-muted rounded-md" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6">
          <Icon name="ExclamationTriangleIcon" size={28} className="text-destructive mx-auto mb-2" />
          <button onClick={load} className="text-sm text-primary underline">{t('admin.retryBtn')}</button>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-6">
          <Icon name="CheckCircleIcon" size={32} className="text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{t('admin.courseQueueEmpty')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {courses.slice(0, 5).map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-muted/40 rounded-md transition-smooth">
                <Icon name="BookOpenIcon" size={18} className="text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.teacherName} · {t('moderation.topicsCountLabel', { count: c.topicCount })}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning shrink-0">
                  {t('moderation.pending')}
                </span>
              </div>
            ))}
          </div>
          {onOpenModeration && (
            <button
              onClick={onOpenModeration}
              className="mt-4 w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-smooth"
            >
              {t('admin.reviewQueueBtn')}
              <Icon name="ArrowRightIcon" size={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
