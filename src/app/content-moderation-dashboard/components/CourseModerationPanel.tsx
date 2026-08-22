'use client';

/**
 * CourseModerationPanel — admin uchun kurslar moderatsiya navbati.
 * GET  /api/admin/course-moderation?status=submitted   — navbat
 * PATCH /api/admin/course-moderation/[id] { action, feedback? } — qaror
 */
import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import ErrorState from '@/components/common/ErrorState';
import EmptyState from '@/components/common/EmptyState';
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
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Tasdiq (approve) — nashr etadi, ConfirmModal orqali
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Reject / revision — feedback modal ichida
  const [modal, setModal] = useState<{ id: string; action: 'reject' | 'request_revision' } | null>(null);
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/admin/course-moderation?status=submitted', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRows(data.courses || []);
    } catch {
      // Xato = "navbat bo'sh" EMAS — nashr moderatsiyasi, aniq xato holati
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

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
      setConfirmId(null);
      setModal(null);
      setFeedback('');
      setRows((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t('moderation.genericError'));
    } finally {
      setBusyId(null);
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
      {error ? (
        <div className="bg-card rounded-md shadow-warm">
          <ErrorState onRetry={load} />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-md shadow-warm">
          <EmptyState icon="CheckBadgeIcon" title={t('moderation.courseQueueEmpty')} />
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
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft="CheckIcon"
                  disabled={busyId === c.id}
                  onClick={() => setConfirmId(c.id)}
                >
                  {t('moderation.approveAction')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  iconLeft="PencilSquareIcon"
                  disabled={busyId === c.id}
                  onClick={() => { setFeedback(''); setModal({ id: c.id, action: 'request_revision' }); }}
                >
                  <span className="hidden sm:inline">{t('moderation.requestRevisionAction')}</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  iconLeft="XMarkIcon"
                  disabled={busyId === c.id}
                  onClick={() => { setFeedback(''); setModal({ id: c.id, action: 'reject' }); }}
                >
                  <span className="hidden sm:inline">{t('moderation.rejectAction')}</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve — kursni nashr etadi, tasdiq talab qilinadi */}
      <ConfirmModal
        open={confirmId !== null}
        title={t('moderation.approveAction')}
        message={t('moderation.approveAction')}
        confirmLabel={t('moderation.approveAction')}
        variant="danger"
        isLoading={confirmId !== null && busyId === confirmId}
        onConfirm={() => confirmId && decide(confirmId, 'approve')}
        onCancel={() => busyId === null && setConfirmId(null)}
      />

      {/* Reject / revision — sabab modal ichida */}
      <Modal
        open={modal !== null}
        onClose={() => { if (busyId === null) { setModal(null); setFeedback(''); } }}
        title={modal?.action === 'reject' ? t('moderation.rejectAction') : t('moderation.requestRevisionAction')}
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setModal(null); setFeedback(''); }} disabled={busyId !== null}>
              {t('moderation.cancel')}
            </Button>
            <Button
              variant={modal?.action === 'reject' ? 'destructive' : 'primary'}
              size="sm"
              loading={modal !== null && busyId === modal.id}
              onClick={() => {
                if (!feedback.trim()) { toast.error(t('moderation.feedbackRequired')); return; }
                if (modal) decide(modal.id, modal.action, feedback.trim());
              }}
            >
              {t('moderation.confirmAction')}
            </Button>
          </>
        }
      >
        <label className="block text-sm font-medium text-foreground mb-1">
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
      </Modal>
    </div>
  );
}
