'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useAdminModeration,
  type ModerationQueueItemDTO,
  type ModerationStatusDTO,
} from '@/hooks/queries/useAdminModeration';
import { useModerateMaterialMutation } from '@/hooks/mutations/useModerateMaterialMutation';
import { useI18n } from '@/contexts/I18nContext';

interface ModerationQueuePanelProps {
  expanded?: boolean;
}

type StatusFilter = ModerationStatusDTO | 'all';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'submitted', label: 'statusNew' },
  { id: 'under_review', label: 'statusUnderReview' },
  { id: 'revision_requested', label: 'modRevisionReq' },
  { id: 'approved', label: 'statusApproved' },
  { id: 'rejected', label: 'statusRejected' },
  { id: 'all', label: 'filterAll' },
];

const STATUS_BADGE: Record<ModerationStatusDTO, { label: string; color: string }> = {
  draft: { label: 'statusDraft', color: 'bg-muted text-muted-foreground' },
  submitted: { label: 'statusNew', color: 'bg-warning/10 text-warning' },
  under_review: { label: 'statusUnderReview', color: 'bg-secondary/10 text-secondary' },
  approved: { label: 'statusApproved', color: 'bg-success/10 text-success' },
  rejected: { label: 'statusRejected', color: 'bg-destructive/10 text-destructive' },
  revision_requested: { label: 'statusRevisionRequested', color: 'bg-primary/10 text-primary' },
};

const CONTENT_TYPE_ICON: Record<string, string> = {
  document: 'DocumentTextIcon',
  video: 'VideoCameraIcon',
  audio: 'MusicalNoteIcon',
  external_link: 'LinkIcon',
};

type PendingAction =
  | { item: ModerationQueueItemDTO; type: 'start_review' }
  | { item: ModerationQueueItemDTO; type: 'approve' }
  | { item: ModerationQueueItemDTO; type: 'reject' }
  | { item: ModerationQueueItemDTO; type: 'request_revision' };

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ModerationQueuePanel = ({ expanded = false }: ModerationQueuePanelProps) => {
  const { t } = useI18n();
  const [status, setStatus] = useState<StatusFilter>('submitted');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, error, refetch } = useAdminModeration({
    status,
    search: search || undefined,
    // expanded=false (Overview tab'da) — faqat top 5 ta yangi
    limit: expanded ? 20 : 5,
  });

  const mutation = useModerateMaterialMutation();

  const items = data?.items ?? [];
  const stats = data?.stats;

  useEffect(() => {
    if (pending) setFeedback('');
  }, [pending]);

  const modalProps = useMemo(() => {
    if (!pending) return null;
    const t = pending.item.material.title;
    switch (pending.type) {
      case 'start_review':
        return {
          title: t('admin.startReviewMod'),
          message: `"${t}" materialining ko'rib chiqilishini boshlaymizmi?`,
          confirmLabel: t('admin.startBtn'),
          variant: 'default' as const,
          requireFeedback: false,
        };
      case 'approve':
        return {
          title: t('admin.approveMaterial'),
          message: `"${t}" material tasdiqlanadi va kursda ko'rinadi.`,
          confirmLabel: t('admin.approveBtn'),
          variant: 'default' as const,
          requireFeedback: false,
        };
      case 'reject':
        return {
          title: t('admin.rejectMaterial'),
          message: `"${t}" material rad etiladi. Sabab kerak.`,
          confirmLabel: t('admin.rejectBtn'),
          variant: 'danger' as const,
          requireFeedback: true,
        };
      case 'request_revision':
        return {
          title: t('admin.requestRevisionMod'),
          message: `"${t}" material uchun teacher'ga aniq izoh yozing.`,
          confirmLabel: t('admin.sendRequest'),
          variant: 'default' as const,
          requireFeedback: true,
        };
    }
  }, [pending]);

  const handleConfirm = () => {
    if (!pending || !modalProps) return;
    if (modalProps.requireFeedback && feedback.trim().length < 5) {
      toast.error(t('admin.reasonMin5'));
      return;
    }
    const messages = {
      start_review: t('admin.reviewStartedMod'),
      approve: t('admin.materialApproved'),
      reject: t('admin.materialRejected'),
      request_revision: t('admin.revisionSentMod'),
    };

    const variables =
      pending.type === 'start_review'
        ? { queueId: pending.item.id, action: 'start_review' as const }
        : pending.type === 'approve'
        ? {
            queueId: pending.item.id,
            action: 'approve' as const,
            feedback: feedback || undefined,
          }
        : pending.type === 'reject'
        ? { queueId: pending.item.id, action: 'reject' as const, feedback }
        : { queueId: pending.item.id, action: 'request_revision' as const, feedback };

    mutation.mutate(variables, {
      onSuccess: () => {
        toast.success(messages[pending.type]);
        setPending(null);
      },
      onError: (err) => toast.error(err.message),
    });
  };

  // ─── Overview compact mode (expanded=false) ──────────────────────────────
  if (!expanded) {
    return (
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            {t('admin.moderationQueue')}
          </h3>
          {stats && stats.submitted > 0 && (
            <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">
              {stats.submitted} {t('admin.newItems')}
            </span>
          )}
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-3 mb-4 text-center">
            <div className="p-3 bg-warning/10 rounded-md">
              <p className="text-xs text-muted-foreground">{t('admin.waitingMod')}</p>
              <p className="text-xl font-heading font-bold text-warning">{stats.submitted}</p>
            </div>
            <div className="p-3 bg-secondary/10 rounded-md">
              <p className="text-xs text-muted-foreground">{t('admin.reviewingMod')}</p>
              <p className="text-xl font-heading font-bold text-secondary">{stats.under_review}</p>
            </div>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-xs text-muted-foreground">{t('admin.averageMod')}</p>
              <p className="text-xl font-heading font-bold text-foreground">
                {stats.avgReviewMinutes > 0 ? `${stats.avgReviewMinutes}m` : '—'}
              </p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-12 bg-muted rounded-md" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-6">
            <Icon name="CheckCircleIcon" size={32} className="text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t('admin.queueEmpty')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 hover:bg-muted/40 rounded-md transition-smooth"
              >
                <Icon
                  name={CONTENT_TYPE_ICON[item.material.contentType ?? ''] ?? 'DocumentIcon'}
                  size={18}
                  className="text-primary shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {item.material.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.material.teacher.fullName}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[item.status].color}`}
                >
                  {t(`admin.${STATUS_BADGE[item.status].label}`)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Expanded mode (moderation tab) ──────────────────────────────────────
  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label={t('admin.statusNew')} value={stats.submitted} icon="ClockIcon" color="text-warning" />
          <StatCard label={t('admin.reviewingMod')} value={stats.under_review} icon="EyeIcon" color="text-secondary" />
          <StatCard label={t('admin.modRevisionReq')} value={stats.revision_requested} icon="ArrowPathIcon" color="text-primary" />
          <StatCard label={t('admin.statusApproved')} value={stats.approved} icon="CheckCircleIcon" color="text-success" />
          <StatCard label={t('admin.statusRejected')} value={stats.rejected} icon="XCircleIcon" color="text-destructive" />
        </div>
      )}

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
              placeholder={t('admin.searchTicketPlaceholder')}
              className="pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            {t('admin.materials')} ({data?.total ?? 0})
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-24 bg-muted rounded-md" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="CheckCircleIcon" size={48} className="text-success mx-auto mb-4" />
            <p className="text-muted-foreground">{t('admin.noMaterials')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isOpen = openItem === item.id;
              const badge = STATUS_BADGE[item.status];
              const iconName = CONTENT_TYPE_ICON[item.material.contentType ?? ''] ?? 'DocumentIcon';
              const canTakeAction =
                item.status === 'submitted' || item.status === 'under_review';
              return (
                <div
                  key={item.id}
                  className="border border-border rounded-md hover:bg-muted/30 transition-smooth"
                >
                  <button
                    onClick={() => setOpenItem(isOpen ? null : item.id)}
                    className="w-full text-left p-4 flex items-start gap-3"
                  >
                    <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-md shrink-0">
                      <Icon name={iconName} size={20} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-heading font-semibold text-foreground truncate">
                          {item.material.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}
                        >
                          {t(`admin.${badge.label}`)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.material.teacher.fullName}
                        {item.material.course && ` · ${item.material.course.title}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        📅 {formatDateTime(item.submittedAt)}
                      </p>
                    </div>
                    <Icon
                      name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                      size={18}
                      className="text-muted-foreground shrink-0 mt-1"
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 border-t border-border space-y-3 text-sm">
                      {item.material.description && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{`📝 ${t('admin.descriptionSection')}`}</p>
                          <p className="whitespace-pre-wrap">{item.material.description}</p>
                        </div>
                      )}

                      {(item.material.fileUrl || item.material.externalLink) && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{`🔗 ${t('admin.sourceSection')}`}</p>
                          <a
                            href={item.material.fileUrl ?? item.material.externalLink ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline break-all"
                          >
                            {t('admin.openMaterial')} ({item.material.fileFormat ?? item.material.contentType ?? 'link'})
                          </a>
                        </div>
                      )}

                      {item.feedback && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{`💬 ${t('admin.previousNote')}`}</p>
                          <div className="p-2 bg-muted/50 rounded border-l-2 border-primary">
                            {item.feedback}
                          </div>
                        </div>
                      )}

                      {item.reviewer && item.reviewedAt && (
                        <p className="text-xs text-muted-foreground">
                          ✓ {item.reviewer.fullName} tomonidan {formatDateTime(item.reviewedAt)}'da
                        </p>
                      )}

                      {canTakeAction && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {item.status === 'submitted' && (
                            <button
                              onClick={() => setPending({ item, type: 'start_review' })}
                              className="text-xs px-3 py-1.5 rounded-md border border-secondary/30 text-secondary hover:bg-secondary/10 transition-smooth flex items-center gap-1"
                            >
                              <Icon name="EyeIcon" size={14} />
                              {t('admin.startBtn')}
                            </button>
                          )}
                          <button
                            onClick={() => setPending({ item, type: 'approve' })}
                            className="text-xs px-3 py-1.5 rounded-md border border-success/30 text-success hover:bg-success/10 transition-smooth flex items-center gap-1"
                          >
                            <Icon name="CheckCircleIcon" size={14} />
                            {t('admin.approveBtn')}
                          </button>
                          <button
                            onClick={() => setPending({ item, type: 'request_revision' })}
                            className="text-xs px-3 py-1.5 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-smooth flex items-center gap-1"
                          >
                            <Icon name="ArrowPathIcon" size={14} />
                            {t('admin.revisionBtn')}
                          </button>
                          <button
                            onClick={() => setPending({ item, type: 'reject' })}
                            className="text-xs px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-smooth flex items-center gap-1"
                          >
                            <Icon name="XCircleIcon" size={14} />
                            {t('admin.rejectBtn')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
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
      {modalProps?.requireFeedback && pending && (
        <FeedbackOverlay
          label={t('admin.feedbackLabel')}
          value={feedback}
          onChange={setFeedback}
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
}: {
  label: string;
  value: number;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-card rounded-md shadow-warm p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon name={icon} size={18} className={color} />
      </div>
      <p className={`text-2xl font-heading font-bold ${color}`}>{value}</p>
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
          placeholder={t('admin.writePlaceholder')}
        />
      </div>
    </div>
  );
}

export default ModerationQueuePanel;
