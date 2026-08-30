'use client';

import { useState, useEffect, useCallback } from 'react';
import AppImage from '@/components/ui/AppImage';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface DiscussionPanelProps {
  topicId: string;
}

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorRole: string;
  isMine: boolean;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'hozirgina';
  if (min < 60) return `${min} daqiqa oldin`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} soat oldin`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString();
}

const DiscussionPanel = ({ topicId }: DiscussionPanelProps) => {
  const { t } = useI18n();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!topicId) {
      setComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`/api/topics/${topicId}/comments`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newComment.trim();
    if (!text || submitting || !topicId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setNewComment('');
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const isStaff = (role: string) => role === 'teacher' || role === 'admin';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="font-heading font-semibold text-foreground mb-1">{t('learning.qaTitle')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t('learning.qaHint')}</p>

        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <textarea
            id="qa-input"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('learning.qaPlaceholder')}
            maxLength={2000}
            aria-label={t('learning.qaPlaceholder')}
            className="w-full px-4 py-3 border border-border rounded-md bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon name="PaperAirplaneIcon" size={16} />
              {submitting ? t('common.loading') : t('learning.qaAsk')}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="h-20 bg-muted/50 rounded-md animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-card rounded-md shadow-warm">
          <Icon name="ExclamationTriangleIcon" size={40} className="text-destructive mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">{t('common.errorOccurred')}</p>
          <button
            type="button"
            onClick={load}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-smooth"
          >
            {t('common.retry')}
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="p-8 text-center bg-card rounded-md shadow-warm">
          <Icon name="QuestionMarkCircleIcon" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">{t('learning.qaEmpty')}</p>
          <p className="text-sm text-muted-foreground">{t('learning.qaEmptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-md shadow-warm ${
                isStaff(c.authorRole)
                  ? 'bg-primary/5 border border-primary/30'
                  : 'bg-card'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                  {c.authorAvatar ? (
                    <AppImage src={c.authorAvatar} alt={c.authorName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">
                      {c.authorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="font-semibold text-foreground truncate">{c.authorName}</p>
                      {isStaff(c.authorRole) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium whitespace-nowrap">
                          {t('learning.instructorBadge')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiscussionPanel;
