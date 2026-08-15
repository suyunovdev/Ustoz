'use client';

/**
 * CourseModerationPanel — admin uchun kurslar moderatsiya navbati.
 * GET  /api/admin/course-moderation?status=submitted   — navbat
 * PATCH /api/admin/course-moderation/[id] { action, feedback? } — qaror
 */
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { SkeletonList } from '@/components/ui/Skeleton';
import { useI18n } from '@/contexts/I18nContext';
import { toast } from '@/components/common/Toaster';
import { formatCurrency } from '@/lib/i18n/format';

interface CourseRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priceUzs: string;
  moderationStatus: string;
  topicCount: number;
  teacherName: string;
  teacherEmail: string;
}

type Action = 'approve' | 'reject' | 'request_revision';

export default function CourseModerationPanel() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ id: string; action: Action } | null>(null);
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/course-moderation?status=submitted', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.courses || []);
    } catch {
      toast.error(t('moderation.genericError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, action: Action, fb?: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/course-moderation/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, feedback: fb }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || '');
      }
      toast.success(
        action === 'approve'
          ? t('moderation.courseApproved')
          : action === 'reject'
            ? t('moderation.courseRejected')
            : t('moderation.courseRevisionRequested'),
      );
      setModal(null);
      setFeedback('');
      setRows((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t('moderation.genericError'));
    } finally {
      setBusyId(null);
    }
  };

  const onAction = (id: string, action: Action) => {
    if (action === 'approve') {
      decide(id, 'approve');
    } else {
      setFeedback('');
      setModal({ id, action });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {rows.length === 0 ? (
        <div className="bg-card rounded-md shadow-warm p-12 text-center">
          <Icon name="CheckBadgeIcon" size={64} className="text-success mx-auto mb-4" />
          <p className="text-muted-foreground">{t('moderation.courseQueueEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((c) => (
            <div
              key={c.id}
              className="bg-card border border-border rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning">
                    {t('moderation.pending')}
                  </span>
                  <span className="text-xs text-muted-foreground">{c.category}</span>
                </div>
                <h3 className="font-heading font-semibold text-foreground truncate">{c.title}</h3>
                {c.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon name="UserIcon" size={14} />
                    {t('moderation.byTeacher')}: {c.teacherName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="BookOpenIcon" size={14} />
                    {t('moderation.topicsCountLabel', { count: c.topicCount })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="CurrencyDollarIcon" size={14} />
                    {Number(c.priceUzs) > 0
                      ? formatCurrency(Number(c.priceUzs), locale, 'UZS')
                      : t('moderation.free')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onAction(c.id, 'approve')}
                  disabled={busyId === c.id}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-success text-success-foreground rounded-md text-sm font-medium hover:bg-success/90 transition-smooth disabled:opacity-50"
                >
                  <Icon name="CheckIcon" size={16} />
                  {t('moderation.approveAction')}
                </button>
                <button
                  onClick={() => onAction(c.id, 'request_revision')}
                  disabled={busyId === c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-muted text-foreground rounded-md text-sm font-medium hover:bg-muted/80 transition-smooth disabled:opacity-50"
                >
                  <Icon name="PencilSquareIcon" size={16} />
                  <span className="hidden sm:inline">{t('moderation.requestRevisionAction')}</span>
                </button>
                <button
                  onClick={() => onAction(c.id, 'reject')}
                  disabled={busyId === c.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm font-medium hover:bg-destructive/20 transition-smooth disabled:opacity-50"
                >
                  <Icon name="XMarkIcon" size={16} />
                  <span className="hidden sm:inline">{t('moderation.rejectAction')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback modal (reject / revision) */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card rounded-lg shadow-warm-lg w-full max-w-md p-6">
            <h3 className="text-lg font-heading font-semibold text-foreground mb-1">
              {modal.action === 'reject'
                ? t('moderation.rejectAction')
                : t('moderation.requestRevisionAction')}
            </h3>
            <label className="block text-sm font-medium text-foreground mt-4 mb-1">
              {t('moderation.feedbackLabel')}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              placeholder={t('moderation.feedbackPlaceholder')}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 text-foreground rounded-md hover:bg-muted transition-smooth text-sm font-medium"
              >
                {t('moderation.cancel')}
              </button>
              <button
                onClick={() => {
                  if (!feedback.trim()) {
                    toast.error(t('moderation.feedbackRequired'));
                    return;
                  }
                  decide(modal.id, modal.action, feedback.trim());
                }}
                disabled={busyId === modal.id}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-smooth text-sm font-medium disabled:opacity-50"
              >
                {t('moderation.confirmAction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
