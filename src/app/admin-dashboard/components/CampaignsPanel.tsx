'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import {
  useAdminCampaigns,
  type CampaignDTO,
  type RecipientFilterDTO,
} from '@/hooks/queries/useAdminCampaigns';
import {
  useCreateCampaignMutation,
  usePreviewRecipientsMutation,
} from '@/hooks/mutations/useCampaignMutations';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  draft: { label: 'Qoralama', color: 'bg-muted text-muted-foreground' },
  sending: { label: 'Yuborilmoqda', color: 'bg-warning/10 text-warning' },
  completed: { label: 'Yakunlangan', color: 'bg-success/10 text-success' },
  failed: { label: 'Xato', color: 'bg-destructive/10 text-destructive' },
};

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

function recipientLabel(filter: RecipientFilterDTO): string {
  switch (filter.type) {
    case 'all_users':
      return 'Barcha foydalanuvchilar';
    case 'by_role':
      return `Rollar: ${filter.roles.join(', ')}`;
    case 'by_course':
      return `${filter.courseIds.length} ta kursdagi talabalar`;
    case 'manual':
      return `${filter.emails.length} ta email`;
  }
}

const CampaignsPanel = () => {
  const { data, isLoading, error, refetch } = useAdminCampaigns();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Yuborilgan email kampaniyalar. Resend orqali yetkaziladi.
        </p>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium flex items-center gap-2 self-start sm:self-auto"
        >
          <Icon name="PaperAirplaneIcon" size={18} />
          Yangi kampaniya
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 text-sm text-destructive flex items-center justify-between">
          <span>Xato: {error.message}</span>
          <button onClick={() => refetch()} className="underline text-xs">
            Qayta urinish
          </button>
        </div>
      )}

      <div className="bg-card rounded-md shadow-warm p-6">
        <h3 className="text-xl font-heading font-semibold text-foreground mb-6">
          Kampaniyalar tarixi ({data?.campaigns.length ?? 0})
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        ) : !data || data.campaigns.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="EnvelopeIcon" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Hozircha hech qanday kampaniya yo'q</p>
            <button
              onClick={() => setCreateOpen(true)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium"
            >
              Birinchi kampaniyani yuboring
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.campaigns.map((c) => (
              <CampaignRow key={c.id} campaign={c} />
            ))}
          </div>
        )}
      </div>

      {createOpen && <CreateCampaignModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
};

function CampaignRow({ campaign }: { campaign: CampaignDTO }) {
  const badge = STATUS_BADGE[campaign.status] ?? STATUS_BADGE.draft;
  return (
    <div className="p-4 border border-border rounded-md hover:bg-muted/30 transition-smooth">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-heading font-semibold text-foreground truncate">
            {campaign.subject}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {recipientLabel(campaign.recipientFilter)} · {campaign.createdBy.fullName}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
        <span>📊 {campaign.totalRecipients} jami</span>
        <span className="text-success">✓ {campaign.sentCount} yuborildi</span>
        {campaign.failedCount > 0 && (
          <span className="text-destructive">✗ {campaign.failedCount} xato</span>
        )}
        <span>📅 {formatDateTime(campaign.createdAt)}</span>
      </div>

      {campaign.errorSummary && (
        <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
          {campaign.errorSummary}
        </div>
      )}
    </div>
  );
}

type FilterType = RecipientFilterDTO['type'];

function CreateCampaignModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all_users');
  const [roles, setRoles] = useState<Array<'student' | 'teacher' | 'admin'>>(['student']);
  const [emails, setEmails] = useState('');
  const [previewResult, setPreviewResult] = useState<{
    count: number;
    capped: boolean;
  } | null>(null);

  const createMut = useCreateCampaignMutation();
  const previewMut = usePreviewRecipientsMutation();

  function buildFilter(): RecipientFilterDTO {
    if (filterType === 'all_users') return { type: 'all_users' };
    if (filterType === 'by_role') return { type: 'by_role', roles };
    if (filterType === 'manual') {
      const list = emails
        .split(/[\s,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return { type: 'manual', emails: list };
    }
    return { type: 'all_users' };
  }

  const handlePreview = () => {
    try {
      const filter = buildFilter();
      previewMut.mutate(
        { recipientFilter: filter },
        {
          onSuccess: (r) => setPreviewResult({ count: r.count, capped: r.capped }),
          onError: (err) => toast.error(err.message),
        },
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleSend = () => {
    if (subject.trim().length < 3) {
      toast.error("Subject kamida 3 belgi");
      return;
    }
    if (bodyHtml.trim().length < 10) {
      toast.error('Matn juda qisqa');
      return;
    }
    try {
      const filter = buildFilter();
      createMut.mutate(
        { subject, bodyHtml, recipientFilter: filter },
        {
          onSuccess: (r) => {
            toast.success(
              `Yuborildi: ${r.campaign.sentCount}/${r.campaign.totalRecipients}`,
            );
            onClose();
          },
          onError: (err) => toast.error(err.message),
        },
      );
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={() => !createMut.isPending && onClose()}
    >
      <div
        className="bg-card rounded-md shadow-warm-lg max-w-2xl w-full p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold text-foreground">
            Yangi email kampaniya
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <Icon name="XMarkIcon" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mavzu (Subject)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Yangi kurslar va chegirmalar"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Body HTML */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email matni (HTML qo'llaniladi)
            </label>
            <textarea
              value={bodyHtml}
              onChange={(e) => setBodyHtml(e.target.value)}
              rows={8}
              placeholder={"<h2>Salom!</h2>\n<p>Yangi qish chegirmasi: 50% off!</p>"}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm resize-y"
            />
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Kimga yuborish
            </label>
            <div className="space-y-2">
              {[
                { id: 'all_users' as const, label: 'Barcha faol foydalanuvchilar' },
                { id: 'by_role' as const, label: 'Rol bo\'yicha' },
                { id: 'manual' as const, label: 'Aniq email manzillar' },
              ].map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="filter"
                    value={opt.id}
                    checked={filterType === opt.id}
                    onChange={() => {
                      setFilterType(opt.id);
                      setPreviewResult(null);
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>

            {filterType === 'by_role' && (
              <div className="mt-3 flex gap-3 pl-6">
                {(['student', 'teacher', 'admin'] as const).map((r) => (
                  <label key={r} className="flex items-center gap-1 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roles.includes(r)}
                      onChange={(e) => {
                        setPreviewResult(null);
                        setRoles((prev) =>
                          e.target.checked ? [...prev, r] : prev.filter((x) => x !== r),
                        );
                      }}
                    />
                    {r}
                  </label>
                ))}
              </div>
            )}

            {filterType === 'manual' && (
              <textarea
                value={emails}
                onChange={(e) => {
                  setEmails(e.target.value);
                  setPreviewResult(null);
                }}
                rows={3}
                placeholder="email1@example.com, email2@example.com"
                className="mt-3 w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            )}

            <button
              type="button"
              onClick={handlePreview}
              disabled={previewMut.isPending}
              className="mt-3 text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-smooth"
            >
              {previewMut.isPending ? 'Tekshirilmoqda...' : 'Necha kishi olishini ko\'rsatish'}
            </button>

            {previewResult && (
              <div className="mt-2 p-2 bg-primary/10 rounded text-xs text-primary">
                <strong>{previewResult.count}</strong> ta foydalanuvchi email oladi
                {previewResult.capped && ' (max 1000 cheklov qo\'llandi)'}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-border">
          <button
            onClick={onClose}
            disabled={createMut.isPending}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-md transition-smooth font-medium disabled:opacity-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleSend}
            disabled={createMut.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-smooth font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {createMut.isPending && (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <Icon name="PaperAirplaneIcon" size={16} />
            Yuborish
          </button>
        </div>
      </div>
    </div>
  );
}

export default CampaignsPanel;
