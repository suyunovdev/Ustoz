'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import {
  REVIEW_TEMPLATES,
  getTemplatesForRating,
  type ReviewRating,
  type ReviewTemplate,
} from '@/lib/data/review-templates';

interface ReviewModalProps {
  courseId: string;
  courseTitle?: string;
  /** Mavjud sharh (edit holati) — yo'q bo'lsa yangi yaratiladi */
  existing?: {
    rating: number;
    comment: string | null;
  } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const ReviewModal = ({
  courseId,
  courseTitle,
  existing,
  onClose,
  onSuccess,
}: ReviewModalProps) => {
  const [rating, setRating] = useState<ReviewRating | 0>(
    (existing?.rating as ReviewRating) ?? 0,
  );
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Existing sharh bo'lsa — mos templateId topish
  useEffect(() => {
    if (existing?.rating && existing.comment) {
      const tpls = getTemplatesForRating(existing.rating);
      const match = tpls.find((t) => t.text === existing.comment);
      if (match) setTemplateId(match.id);
    }
  }, [existing]);

  const templates = rating > 0 ? getTemplatesForRating(rating) : [];

  // Rating o'zgarganda templateId'ni reset qilish (boshqa rating shablonlari)
  useEffect(() => {
    if (rating > 0 && templateId) {
      const [tplRating] = templateId.split('-');
      if (Number(tplRating) !== rating) {
        setTemplateId(null);
      }
    }
  }, [rating, templateId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Reyting tanlang");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          ...(templateId ? { templateId } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || `Saqlanmadi (${res.status})`);
        return;
      }
      toast.success(existing ? "Sharh yangilandi" : "Sharh saqlandi");
      onSuccess?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-card rounded-md shadow-warm-lg max-w-lg w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-semibold">
            {existing ? 'Sharhni tahrirlash' : 'Sharh qoldiring'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1 hover:bg-muted rounded disabled:opacity-50"
            aria-label="Yopish"
          >
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        {courseTitle && (
          <p className="text-sm text-muted-foreground mb-4">{courseTitle}</p>
        )}

        {/* Rating stars */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Reytingingiz *</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = (hoverRating || rating) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n as ReviewRating)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={submitting}
                  className="p-1 hover:scale-110 transition-transform disabled:opacity-50"
                  aria-label={`${n} yulduz`}
                >
                  <Icon
                    name="StarIcon"
                    size={32}
                    className={filled ? 'text-warning' : 'text-muted-foreground/30'}
                  />
                </button>
              );
            })}
            {rating > 0 && (
              <span className="ml-3 text-sm text-muted-foreground">
                {rating}/5
              </span>
            )}
          </div>
        </div>

        {/* Template selector — faqat rating tanlangandan keyin */}
        {rating > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">
              Sharh tanlang{' '}
              <span className="text-muted-foreground font-normal text-xs">
                (ixtiyoriy)
              </span>
            </p>
            <ul className="space-y-2">
              {templates.map((tpl) => {
                const selected = templateId === tpl.id;
                return (
                  <li key={tpl.id}>
                    <button
                      type="button"
                      onClick={() => setTemplateId(selected ? null : tpl.id)}
                      disabled={submitting}
                      className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border hover:bg-muted/50 text-muted-foreground'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 ${
                            selected
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground/40'
                          }`}
                        >
                          {selected && (
                            <Icon
                              name="CheckIcon"
                              size={10}
                              className="text-primary-foreground"
                            />
                          )}
                        </div>
                        <span>{tpl.text}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {templateId && (
              <button
                type="button"
                onClick={() => setTemplateId(null)}
                disabled={submitting}
                className="text-xs text-muted-foreground hover:text-primary mt-2"
              >
                Sharhsiz saqlash (faqat reyting)
              </button>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground italic mb-4">
          ℹ Erkin matn yozish imkoniyati yo'q — yuqoridagi shablonlardan birini
          tanlang yoki sharhsiz saqlang.
        </p>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md text-sm disabled:opacity-50"
          >
            Bekor
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            {existing ? 'Saqlash' : 'Yuborish'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
// Re-export for convenience
export { REVIEW_TEMPLATES };
export type { ReviewTemplate };
