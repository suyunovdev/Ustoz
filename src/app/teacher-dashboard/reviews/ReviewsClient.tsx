'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import {
  useTeacherReviews,
  useCourseReviewStats,
  type ReviewDTO,
  type ReviewSortDTO,
} from '@/hooks/queries/useTeacherReviews';
import {
  useSetReviewReplyMutation,
  useDeleteReviewReplyMutation,
} from '@/hooks/mutations/useReviewMutations';
import { useTeacherDashboard } from '@/hooks/queries/useTeacherDashboard';

const SORT_OPTIONS: { value: ReviewSortDTO; label: string }[] = [
  { value: 'newest', label: 'Yangi' },
  { value: 'oldest', label: 'Eski' },
  { value: 'highest_rating', label: '5⭐ yuqori' },
  { value: 'lowest_rating', label: '1⭐ yuqori' },
  { value: 'most_helpful', label: 'Eng foydali' },
];

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="StarIcon"
          size={size}
          className={n <= rating ? 'text-warning' : 'text-muted-foreground/30'}
        />
      ))}
    </div>
  );
}

function timeAgo(d: string): string {
  const ms = Date.now() - new Date(d).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days === 0) return 'bugun';
  if (days === 1) return 'kecha';
  if (days < 30) return `${days} kun oldin`;
  if (days < 365) return `${Math.floor(days / 30)} oy oldin`;
  return `${Math.floor(days / 365)} yil oldin`;
}

export default function ReviewsClient() {
  const [courseId, setCourseId] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [withoutReply, setWithoutReply] = useState(false);
  const [sort, setSort] = useState<ReviewSortDTO>('newest');

  const { data, isLoading, error } = useTeacherReviews({
    courseId: courseId || undefined,
    rating: ratingFilter,
    withoutReply: withoutReply || undefined,
    sort,
  });
  const dashboard = useTeacherDashboard();
  const courses = dashboard.data?.courses ?? [];
  const stats = useCourseReviewStats(courseId || null);

  const reviews = data?.rows ?? [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Link
          href="/teacher-dashboard"
          className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-2"
        >
          <Icon name="ArrowLeftIcon" size={14} />
          Dashboard
        </Link>
        <h1 className="text-2xl font-heading font-semibold">Sharhlar</h1>
        <p className="text-sm text-muted-foreground">
          Talabalar sharhlari va sizning javoblaringiz
        </p>
      </div>

      {courseId && stats.data && (
        <StatsCard stats={stats.data.stats} />
      )}

      <div className="bg-card border border-border rounded-md p-3 mb-4 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="px-3 py-1.5 border border-border rounded-md text-sm bg-background"
          >
            <option value="">Barcha kurslar</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ReviewSortDTO)}
            className="px-3 py-1.5 border border-border rounded-md text-sm bg-background"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={withoutReply}
              onChange={(e) => setWithoutReply(e.target.checked)}
            />
            Javobsiz
          </label>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setRatingFilter(undefined)}
            className={`px-2.5 py-1 rounded-full text-xs ${
              !ratingFilter
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Barcha reyting
          </button>
          {[5, 4, 3, 2, 1].map((n) => (
            <button
              key={n}
              onClick={() => setRatingFilter(n)}
              className={`px-2.5 py-1 rounded-full text-xs ${
                ratingFilter === n
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {n}⭐
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md mb-4 text-sm">
          {(error as Error).message}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-32 bg-muted rounded-md" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-md">
          <Icon
            name="ChatBubbleLeftRightIcon"
            size={48}
            className="text-muted-foreground mx-auto mb-3"
          />
          <p className="text-muted-foreground">
            Sharh topilmadi
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatsCard({ stats }: { stats: NonNullable<ReturnType<typeof useCourseReviewStats>['data']>['stats'] }) {
  return (
    <div className="bg-card border border-border rounded-md p-4 mb-4 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4">
      <div className="flex flex-col items-center justify-center text-center">
        <p className="text-5xl font-bold text-foreground">{stats.avgRating || 0}</p>
        <Stars rating={Math.round(stats.avgRating)} size={20} />
        <p className="text-xs text-muted-foreground mt-1">
          {stats.totalReviews} sharh · {stats.withCommentCount} izoh
        </p>
        <p className="text-xs text-success mt-1">
          {stats.repliedRatePct}% javob berilgan
        </p>
      </div>
      <div className="space-y-1">
        {stats.distribution.map((d) => (
          <div key={d.stars} className="flex items-center gap-2 text-xs">
            <span className="w-6 shrink-0">{d.stars}⭐</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-warning transition-all"
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <span className="w-12 text-right text-muted-foreground">
              {d.count} · {d.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: ReviewDTO }) {
  const [editing, setEditing] = useState(false);
  const [replyText, setReplyText] = useState(review.teacherReply ?? '');
  const setMut = useSetReviewReplyMutation();
  const delMut = useDeleteReviewReplyMutation();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim().length < 2) {
      toast.error("Javob kamida 2 belgi");
      return;
    }
    setMut.mutate(
      { reviewId: review.id, reply: replyText },
      {
        onSuccess: () => {
          toast.success(review.teacherReply ? 'Javob yangilandi' : 'Javob saqlandi');
          setEditing(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  const handleDelete = () => {
    if (!confirm("Javobni o'chirasizmi?")) return;
    delMut.mutate(review.id, {
      onSuccess: () => {
        toast.success("Javob o'chirildi");
        setReplyText('');
        setEditing(false);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="bg-card border border-border rounded-md p-4">
      <div className="flex items-start gap-3 mb-2">
        {review.studentAvatarUrl ? (
          <img
            src={review.studentAvatarUrl}
            alt={review.studentName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
            {review.studentName.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium text-foreground">{review.studentName}</p>
            <Stars rating={review.rating} />
            {review.isVerifiedPurchase && (
              <span className="text-[10px] px-2 py-0.5 bg-success/10 text-success rounded-full">
                ✓ Tasdiqlangan
              </span>
            )}
            {review.helpfulCount > 0 && (
              <span className="text-xs text-muted-foreground">
                👍 {review.helpfulCount}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{timeAgo(review.createdAt)}</p>
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-foreground mb-3 whitespace-pre-wrap">
          {review.comment}
        </p>
      )}

      {!editing && review.teacherReply && (
        <div className="border-l-2 border-primary/40 pl-3 py-2 bg-primary/5 rounded-r-md mt-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-primary">
              💬 Sizning javobingiz
            </p>
            <div className="flex items-center gap-2 text-xs">
              {review.teacherReplyAt && (
                <span className="text-muted-foreground">
                  {timeAgo(review.teacherReplyAt)}
                  {review.teacherReplyEditedAt && ' · tahrirlangan'}
                </span>
              )}
              <button
                onClick={() => setEditing(true)}
                className="text-primary hover:underline"
              >
                Tahrirlash
              </button>
              <button
                onClick={handleDelete}
                disabled={delMut.isPending}
                className="text-destructive hover:underline"
              >
                O'chirish
              </button>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap">{review.teacherReply}</p>
        </div>
      )}

      {!editing && !review.teacherReply && (
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-2"
        >
          <Icon name="ArrowUturnLeftIcon" size={10} />
          Javob yozish
        </button>
      )}

      {editing && (
        <form onSubmit={handleSave} className="mt-3 space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Javobingizni yozing…"
            className="w-full px-3 py-2 border border-border rounded-md text-sm resize-y"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setReplyText(review.teacherReply ?? '');
              }}
              disabled={setMut.isPending}
              className="px-3 py-1.5 text-foreground hover:bg-muted rounded text-sm disabled:opacity-50"
            >
              Bekor
            </button>
            <button
              type="submit"
              disabled={setMut.isPending}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {setMut.isPending && (
                <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {review.teacherReply ? 'Saqlash' : 'Yuborish'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
