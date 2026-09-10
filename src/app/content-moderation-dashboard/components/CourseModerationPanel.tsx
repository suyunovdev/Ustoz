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
  adminFeedback: string | null;
  reviewedAt: string | null;
  topicCount: number;
  teacherName: string;
  teacherEmail: string;
}

type Action = 'approve' | 'reject' | 'request_revision';
type StatusFilter = 'submitted' | 'approved' | 'rejected' | 'revision_requested' | 'all';

// Filtr tab\'lari — kutayotgan navbat + tarix (tasdiqlangan/rad etilgan/tuzatish)
const STATUS_FILTERS: { id: StatusFilter; labelKey: string }[] = [
  { id: 'submitted', labelKey: 'moderation.filterSubmitted' },
  { id: 'revision_requested', labelKey: 'moderation.filterRevision' },
  { id: 'approved', labelKey: 'moderation.filterApproved' },
  { id: 'rejected', labelKey: 'moderation.filterRejected' },
  { id: 'all', labelKey: 'moderation.filterAll' },
];

const STATUS_BADGE: Record<string, { labelKey: string; color: string }> = {
  submitted: { labelKey: 'moderation.pending', color: 'bg-warning/10 text-warning' },
  under_review: { labelKey: 'moderation.pending', color: 'bg-secondary/10 text-secondary' },
  approved: { labelKey: 'moderation.filterApproved', color: 'bg-success/10 text-success' },
  rejected: { labelKey: 'moderation.filterRejected', color: 'bg-destructive/10 text-destructive' },
  revision_requested: { labelKey: 'moderation.filterRevision', color: 'bg-primary/10 text-primary' },
};

export default function CourseModerationPanel() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('submitted');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  // Tasdiq (approve) — nashr etadi, ConfirmModal orqali
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Reject / revision — feedback modal ichida
  const [modal, setModal] = useState<{ id: string; action: 'reject' | 'request_revision' } | null>(null);
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async (status: StatusFilter) => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/admin/course-moderation?status=${status}`, {
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
    load(statusFilter);
  }, [load, statusFilter]);

  // Tasdiq dialogi uchun tanlangan kurs (boy matn ko'rsatish uchun)
  const confirmCourse = confirmId ? rows.find((c) => c.id === confirmId) ?? null : null;
  // Faqat kutayotgan/tuzatish holatlarida amal tugmalari ko'rinadi
  const isActionable = (s: string) =>
    s === 'submitted' || s === 'under_review' || s === 'revision_requested';

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
      // Joriy filtrga mos ro'yxatni qayta yuklaymiz (tarix ko'rinishlari ham yangilanadi)
      load(statusFilter);
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : t('moderation.genericError'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Holat filtri — kutayotgan navbat + tarix (tasdiqlangan/rad etilgan) ko'rish */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-smooth ${
              statusFilter === f.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <div className="bg-card rounded-md shadow-warm">
          <ErrorState onRetry={() => load(statusFilter)} />
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-card rounded-md shadow-warm">
          <EmptyState icon="CheckBadgeIcon" title={t('moderation.courseQueueEmpty')} />
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map((c) => {
            const badge = STATUS_BADGE[c.moderationStatus] ?? STATUS_BADGE.submitted;
            return (
            <div
              key={c.id}
              className="bg-card border border-border rounded-lg p-5 flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${badge.color}`}>
                    {t(badge.labelKey)}
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
                {/* Tarix: rad etilgan/tuzatish holatida oldingi izoh ko'rinsin */}
                {c.adminFeedback && (
                  <div className="mt-2 p-2 bg-muted/50 rounded border-l-2 border-primary text-xs text-foreground">
                    <span className="text-muted-foreground">{t('moderation.feedbackLabel')}:</span> {c.adminFeedback}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Ko'rib chiqish — kursni yangi tabda ochadi (ilgari admin ko'rmasdan tasdiqlardi) */}
                <a
                  href={`/courses/${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-smooth"
                >
                  <Icon name="EyeIcon" size={16} />
                  <span className="hidden sm:inline">{t('moderation.previewAction')}</span>
                </a>
                {isActionable(c.moderationStatus) && (
                  <>
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
                  </>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Approve — kursni nashr etadi. Boy matn: qaysi kurs, kim, nechta mavzu, narx +
          jonli bo'lishi haqida ogohlantirish (ilgari faqat "Tasdiqlash" edi) */}
      <ConfirmModal
        open={confirmId !== null}
        title={t('moderation.approveTitle')}
        message={
          confirmCourse
            ? t('moderation.approveConfirmMessage', {
                title: confirmCourse.title,
                teacher: confirmCourse.teacherName,
                topics: confirmCourse.topicCount,
                price:
                  Number(confirmCourse.priceUzs) > 0
                    ? formatCurrency(Number(confirmCourse.priceUzs), locale, 'UZS')
                    : t('moderation.free'),
              })
            : t('moderation.approveAction')
        }
        confirmLabel={t('moderation.approveAndPublish')}
        variant="default"
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
