'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useAdminReviews,
  type AdminReviewDTO,
  type ReviewStatusDTO,
} from '@/hooks/queries/useAdminReviews';
import { useReviewActionMutation } from '@/hooks/mutations/useReviewActionMutation';
import { useI18n } from '@/contexts/I18nContext';

const STATUS_TABS: { id: ReviewStatusDTO; label: string }[] = [
  { id: 'all', label: 'reviewsAll' },
  { id: 'visible', label: 'reviewsActive' },
  { id: 'hidden', label: 'reviewsHidden' },
  { id: 'reported', label: 'reviewsReported' },
];

type PendingAction =
  | { review: AdminReviewDTO; type: 'hide' }
  | { review: AdminReviewDTO; type: 'unhide' }
  | { review: AdminReviewDTO; type: 'delete' };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="StarIcon"
          variant={n <= value ? 'solid' : 'outline'}
          size={14}
          className={n <= value ? 'text-warning' : 'text-muted-foreground'}
        />
      ))}
    </div>
  );
}

const ReviewsPanel = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<ReviewStatusDTO>('all');
  const [rating, setRating] = useState<number | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, error, refetch } = useAdminReviews({
    status,
    rating,
    search: search || undefined,
  });

  const mutation = useReviewActionMutation();

  const reviews = data?.reviews ?? [];
  const stats = data?.stats;

  useEffect(() => {
    if (pending) setReason('');
  }, [pending]);

  const modalProps = useMemo(() => {
    if (!pending) return null;
    const { review, type } = pending;
    const courseTitle = review.course.title;
    switch (type) {
      case 'hide':
        return {
          title: t('admin.hideReview'),
          message: `"${courseTitle}" kursidagi ${review.student.fullName}'ning sharhini yashirsangiz, talabalar ko'rmaydi (lekin DB'da qoladi).`,
          confirmLabel: t('admin.hideBtn'),
          variant: 'default' as const,
          requireReason: true,
        };
      case 'unhide':
        return {
          title: t('admin.unhideReview'),
          message: `Sharh qayta ommaviy ko'rinadi.`,
          confirmLabel: t('admin.unhideBtn'),
          variant: 'default' as const,
          requireReason: false,
        };
      case 'delete':
        return {
          title: t('admin.deleteReview'),
          message: `${review.student.fullName} sharhi DB'dan butunlay o'chiriladi. Kurs reytingi qayta hisoblanadi. Bu amalni bekor qilib bo'lmaydi.`,
          confirmLabel: t('admin.deleteBtn'),
          variant: 'danger' as const,
          requireReason: true,
        };
    }
  }, [pending]);

  const handleConfirm = () => {
    if (!pending || !modalProps) return;
    if (modalProps.requireReason && reason.trim().length < 5) {
      toast.error(t('admin.noteRequired'));
      return;
    }
    const successMsg = {
      hide: t('admin.reviewHidden'),
      unhide: t('admin.reviewUnhidden'),
      delete: t('admin.reviewDeleted'),
    }[pending.type];

    const variables =
      pending.type === 'unhide'
        ? { reviewId: pending.review.id, action: 'unhide' as const }
        : {
            reviewId: pending.review.id,
            action: pending.type as 'hide' | 'delete',
            reason,
          };

    mutation.mutate(variables, {
      onSuccess: () => {
        toast.success(successMsg);
        setPending(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label={t('admin.total')} value={stats.total} icon="ChatBubbleLeftRightIcon" color="text-foreground" />
          <StatCard label={t('admin.reviewsActive')} value={stats.visible} icon="EyeIcon" color="text-success" />
          <StatCard label={t('admin.hidden')} value={stats.hidden} icon="EyeSlashIcon" color="text-warning" />
          <StatCard label={t('admin.reported')} value={stats.reported} icon="FlagIcon" color="text-destructive" />
          <StatCard
            label={t('admin.average')}
            value={`${stats.avgRating.toFixed(1)} ⭐`}
            icon="StarIcon"
            color="text-warning"
            isText
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-md shadow-warm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 flex-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatus(tab.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-smooth ${
                  status === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {t(`admin.${tab.label}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <select
              value={rating === 'all' ? 'all' : String(rating)}
              onChange={(e) =>
                setRating(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            >
              <option value="all">{t('admin.allRating')}</option>
              <option value="5">5 ⭐</option>
              <option value="4">4 ⭐</option>
              <option value="3">3 ⭐</option>
              <option value="2">2 ⭐</option>
              <option value="1">1 ⭐</option>
            </select>

            <div className="relative flex-1 lg:flex-none">
              <Icon
                name="MagnifyingGlassIcon"
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('admin.searchReviewPlaceholder')}
                className="pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-64"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reviews list */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            {t('admin.reviewsCount')} ({data?.total ?? 0})
          </h3>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">{t('admin.updating')}</span>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4 text-sm text-destructive flex items-center justify-between">
            <span>{t('admin.error')}: {error.message}</span>
            <button onClick={() => refetch()} className="underline text-xs">
              {t('admin.retryBtn')}
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="ChatBubbleLeftRightIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t('admin.reviewsNotFound')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => {
              const isHidden = review.hiddenAt !== null;
              return (
                <div
                  key={review.id}
                  className={`p-4 border rounded-md transition-smooth ${
                    isHidden
                      ? 'border-warning/30 bg-warning/5'
                      : 'border-border hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full shrink-0">
                      <Icon name="UserIcon" size={20} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">
                          {review.student.fullName}
                        </span>
                        <Stars value={review.rating} />
                        {isHidden && (
                          <span className="px-2 py-0.5 text-xs bg-warning/10 text-warning rounded-full">
                            {t('admin.hidden')}
                          </span>
                        )}
                        {review.reportCount > 0 && (
                          <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive rounded-full flex items-center gap-1">
                            <Icon name="FlagIcon" size={10} />
                            {review.reportCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {review.course.title} · {formatDate(review.createdAt)}
                      </p>
                      {review.comment && (
                        <p className="text-sm text-foreground whitespace-pre-wrap break-words mb-2">
                          {review.comment}
                        </p>
                      )}
                      {review.hideReason && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground border-l-2 border-warning">
                          <strong>{t('admin.hideReason')}:</strong> {review.hideReason}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 shrink-0">
                      {isHidden ? (
                        <button
                          onClick={() => setPending({ review, type: 'unhide' })}
                          className="text-xs px-3 py-1.5 rounded-md border border-success/30 text-success hover:bg-success/10 transition-smooth flex items-center gap-1"
                        >
                          <Icon name="EyeIcon" size={14} />
                          {t('admin.unhideBtn')}
                        </button>
                      ) : (
                        <button
                          onClick={() => setPending({ review, type: 'hide' })}
                          className="text-xs px-3 py-1.5 rounded-md border border-warning/30 text-warning hover:bg-warning/10 transition-smooth flex items-center gap-1"
                        >
                          <Icon name="EyeSlashIcon" size={14} />
                          {t('admin.hideBtn')}
                        </button>
                      )}
                      <button
                        onClick={() => setPending({ review, type: 'delete' })}
                        className="text-xs px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-smooth flex items-center gap-1"
                      >
                        <Icon name="TrashIcon" size={14} />
                        {t('admin.deleteBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalProps && pending && (
        <ConfirmModal
          open={true}
          title={modalProps.title}
          message={modalProps.message}
          confirmLabel={modalProps.confirmLabel}
          variant={modalProps.variant}
          isLoading={mutation.isPending}
          onConfirm={handleConfirm}
          onCancel={() => !mutation.isPending && setPending(null)}
        />
      )}
      {modalProps?.requireReason && pending && (
        <FeedbackOverlay
          label={t('admin.reasonLabel')}
          value={reason}
          onChange={setReason}
        />
      )}
    </div>
  );
};

function StatCard({
  label,
  value,
  icon,
  color,
  isText,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-card rounded-md shadow-warm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon name={icon} size={18} className={color} />
      </div>
      <p className={`font-heading font-bold ${color} ${isText ? 'text-lg' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  );
}

function FeedbackOverlay({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[210] w-full max-w-md pointer-events-none"
      style={{ bottom: '30%' }}
    >
      <div className="bg-card border border-border rounded-md shadow-warm-lg p-3 mx-4 pointer-events-auto">
        <label className="block text-xs text-muted-foreground mb-1">{label}</label>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full p-2 border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          placeholder={t('admin.reasonPlaceholder')}
        />
      </div>
    </div>
  );
}

export default ReviewsPanel;
