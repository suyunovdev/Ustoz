'use client';

import { useEffect, useMemo, useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/components/common/Toaster';
import {
  useAdminTeacherApplications,
  type TeacherApplicationDTO,
  type ApplicationStatusDTO,
} from '@/hooks/queries/useAdminTeacherApplications';
import { useReviewTeacherAppMutation } from '@/hooks/mutations/useReviewTeacherAppMutation';

type StatusFilter = ApplicationStatusDTO | 'all';

const STATUS_TABS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Barchasi' },
  { id: 'pending', label: 'Yangi' },
  { id: 'under_review', label: "Ko'rib chiqilmoqda" },
  { id: 'approved', label: 'Tasdiqlangan' },
  { id: 'rejected', label: 'Rad etilgan' },
];

const STATUS_BADGE: Record<ApplicationStatusDTO, { label: string; color: string }> = {
  pending: { label: 'Yangi', color: 'bg-warning/10 text-warning' },
  under_review: { label: "Ko'rib chiqilmoqda", color: 'bg-secondary/10 text-secondary' },
  approved: { label: 'Tasdiqlangan', color: 'bg-success/10 text-success' },
  rejected: { label: 'Rad etilgan', color: 'bg-destructive/10 text-destructive' },
};

type PendingAction =
  | { app: TeacherApplicationDTO; type: 'start_review' }
  | { app: TeacherApplicationDTO; type: 'approve' }
  | { app: TeacherApplicationDTO; type: 'reject' };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const TeacherApplicationsPanel = () => {
  const [status, setStatus] = useState<StatusFilter>('pending');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, error, refetch } = useAdminTeacherApplications({
    status,
    search: search || undefined,
  });

  const mutation = useReviewTeacherAppMutation();

  const apps = data?.applications ?? [];
  const stats = data?.stats;

  useEffect(() => {
    if (pending) setFeedback('');
  }, [pending]);

  const modalProps = useMemo(() => {
    if (!pending) return null;
    const { type, app } = pending;
    if (type === 'start_review') {
      return {
        title: "Ko'rib chiqishni boshlash",
        message: `${app.fullName}'ning arizasi "Ko'rib chiqilmoqda" holatiga o'tadi.`,
        confirmLabel: 'Boshlash',
        variant: 'default' as const,
        requireFeedback: false,
      };
    }
    if (type === 'approve') {
      return {
        title: "Arizani tasdiqlash",
        message: `${app.fullName} o'qituvchi sifatida tasdiqlanadi. User role 'teacher'ga o'zgaradi.`,
        confirmLabel: 'Tasdiqlash',
        variant: 'default' as const,
        requireFeedback: false,
        feedbackLabel: 'Tabriklash matni (ixtiyoriy)',
      };
    }
    return {
      title: 'Arizani rad etish',
      message: `${app.fullName}'ga sabab yozing.`,
      confirmLabel: 'Rad etish',
      variant: 'danger' as const,
      requireFeedback: true,
      feedbackLabel: 'Rad etish sababi',
    };
  }, [pending]);

  const handleConfirm = () => {
    if (!pending || !modalProps) return;
    if (modalProps.requireFeedback && feedback.trim().length < 5) {
      toast.error("Sabab kamida 5 belgi");
      return;
    }
    const successMsg = {
      start_review: "Ko'rib chiqish boshlandi",
      approve: "Ariza tasdiqlandi — user endi o'qituvchi",
      reject: 'Ariza rad etildi',
    }[pending.type];

    const variables =
      pending.type === 'start_review'
        ? { applicationId: pending.app.id, action: 'start_review' as const }
        : pending.type === 'approve'
        ? {
            applicationId: pending.app.id,
            action: 'approve' as const,
            feedback: feedback || undefined,
          }
        : { applicationId: pending.app.id, action: 'reject' as const, feedback };

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
          <StatCard label="Jami" value={stats.total} icon="DocumentTextIcon" color="text-foreground" />
          <StatCard label="Yangi" value={stats.pending} icon="ClockIcon" color="text-warning" />
          <StatCard label="Ko'rilmoqda" value={stats.under_review} icon="EyeIcon" color="text-secondary" />
          <StatCard label="Tasdiqlangan" value={stats.approved} icon="CheckCircleIcon" color="text-success" />
          <StatCard label="Rad etilgan" value={stats.rejected} icon="XCircleIcon" color="text-destructive" />
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
                {tab.label}
                {tab.id !== 'all' && stats && stats[tab.id as keyof typeof stats] > 0 && (
                  <span className="ml-2 text-xs opacity-75">
                    {stats[tab.id as keyof typeof stats]}
                  </span>
                )}
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
              placeholder="Ism, email, soha..."
              className="pl-9 pr-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full lg:w-64"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-card rounded-md shadow-warm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            Arizalar ({data?.total ?? 0})
          </h3>
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">Yangilanmoqda...</span>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4 text-sm text-destructive flex items-center justify-between">
            <span>Xato: {error.message}</span>
            <button onClick={() => refetch()} className="underline text-xs">
              Qayta urinish
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="DocumentTextIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Arizalar topilmadi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((app) => {
              const badge = STATUS_BADGE[app.status];
              const isOpen = expanded === app.id;
              return (
                <div
                  key={app.id}
                  className="border border-border rounded-md hover:bg-muted/30 transition-smooth"
                >
                  <button
                    onClick={() => setExpanded(isOpen ? null : app.id)}
                    className="w-full text-left p-4 flex items-start gap-3"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full shrink-0">
                      <Icon name="UserIcon" size={24} className="text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-heading font-semibold text-foreground truncate">
                          {app.fullName}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {app.email} · {app.expertise}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        📅 {formatDate(app.createdAt)}
                      </p>
                    </div>
                    <Icon
                      name={isOpen ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                      size={20}
                      className="text-muted-foreground shrink-0"
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-0 border-t border-border space-y-3">
                      <Section title="📞 Aloqa">
                        <p>
                          <strong>Telefon:</strong> {app.phone ?? '—'}
                        </p>
                        <p>
                          <strong>Email:</strong> {app.email}
                        </p>
                      </Section>

                      <Section title="🎯 Mutaxassislik">
                        <p>{app.expertise}</p>
                      </Section>

                      <Section title="📝 Bio">
                        <p className="whitespace-pre-wrap">{app.bio}</p>
                      </Section>

                      <Section title="💡 Motivatsiya">
                        <p className="whitespace-pre-wrap">{app.motivation}</p>
                      </Section>

                      {app.experience && (
                        <Section title="💼 Tajriba">
                          <p className="whitespace-pre-wrap">{app.experience}</p>
                        </Section>
                      )}

                      {app.sampleUrl && (
                        <Section title="🔗 Namuna ish">
                          <a
                            href={app.sampleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline break-all"
                          >
                            {app.sampleUrl}
                          </a>
                        </Section>
                      )}

                      {app.feedback && (
                        <Section title="💬 Admin javobi">
                          <div className="p-2 bg-muted/50 rounded text-sm border-l-2 border-primary">
                            {app.feedback}
                          </div>
                        </Section>
                      )}

                      {(app.status === 'pending' || app.status === 'under_review') && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {app.status === 'pending' && (
                            <button
                              onClick={() => setPending({ app, type: 'start_review' })}
                              className="text-sm px-3 py-1.5 rounded-md border border-secondary/30 text-secondary hover:bg-secondary/10 transition-smooth flex items-center gap-1"
                            >
                              <Icon name="EyeIcon" size={14} />
                              Ko'rib chiqishni boshlash
                            </button>
                          )}
                          <button
                            onClick={() => setPending({ app, type: 'approve' })}
                            className="text-sm px-3 py-1.5 rounded-md border border-success/30 text-success hover:bg-success/10 transition-smooth flex items-center gap-1"
                          >
                            <Icon name="CheckCircleIcon" size={14} />
                            Tasdiqlash
                          </button>
                          <button
                            onClick={() => setPending({ app, type: 'reject' })}
                            className="text-sm px-3 py-1.5 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-smooth flex items-center gap-1"
                          >
                            <Icon name="XCircleIcon" size={14} />
                            Rad etish
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
      {pending &&
        modalProps &&
        (modalProps.requireFeedback || pending.type === 'approve') && (
          <FeedbackOverlay
            label={
              'feedbackLabel' in modalProps && modalProps.feedbackLabel
                ? modalProps.feedbackLabel
                : 'Izoh'
            }
            value={feedback}
            onChange={setFeedback}
          />
        )}
    </div>
  );
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{title}</p>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

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
          placeholder="Yozing..."
        />
      </div>
    </div>
  );
}

export default TeacherApplicationsPanel;
