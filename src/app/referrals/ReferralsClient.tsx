'use client';

import { useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import ErrorState from '@/components/common/ErrorState';
import { toast } from '@/components/common/Toaster';
import {
  useMyReferral,
  useMyEarnings,
  type EarningStatusDTO,
} from '@/hooks/queries/useReferrals';
import { useI18n } from '@/contexts/I18nContext';
import { formatDate, formatNumber } from '@/lib/i18n/format';
import type { Locale } from '@/lib/i18n';

function fmtUzs(s: string, locale: Locale): string {
  return formatNumber(Number(s), locale);
}

const STATUS_COLOR: Record<EarningStatusDTO, string> = {
  pending: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function ReferralsClient() {
  const { t, locale } = useI18n();
  const { data, isLoading, error, refetch } = useMyReferral();
  const [statusFilter, setStatusFilter] = useState<EarningStatusDTO | undefined>();
  const earnings = useMyEarnings(statusFilter);

  if (error)
    return <ErrorState message={(error as Error).message} onRetry={() => refetch()} />;
  if (isLoading || !data) return <div className="p-8">{t('common.loading')}</div>;

  const ref = data.referral;
  const refLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/r/${ref.code}`
      : `/r/${ref.code}`;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('referrals.copied', { label }));
    } catch {
      toast.error(t('referrals.copyFailed'));
    }
  };

  const shareText = encodeURIComponent(t('referrals.shareText'));

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Link
        href="/profile"
        className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1 mb-3"
      >
        <Icon name="ArrowLeftIcon" size={14} />
        {t('referrals.profile')}
      </Link>

      <h1 className="text-2xl font-heading font-semibold mb-1">{t('referrals.title')}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {t('referrals.subtitle')}
      </p>

      <div className="bg-gradient-to-br from-primary/10 via-card to-warning/5 border border-border rounded-md p-6 mb-6">
        <p className="text-xs text-muted-foreground mb-1">{t('referrals.yourCode')}</p>
        <div className="flex items-center gap-2 mb-3">
          <code className="text-3xl font-mono font-bold text-primary tracking-wider">
            {ref.code}
          </code>
          <button
            onClick={() => handleCopy(ref.code, t('referrals.codeLabel'))}
            className="p-2 hover:bg-muted rounded-md"
            aria-label={t('referrals.copyAria')}
          >
            <Icon name="ClipboardDocumentIcon" size={16} />
          </button>
        </div>

        <p className="text-xs text-muted-foreground mb-1 mt-3">{t('referrals.shareableLink')}</p>
        <div className="flex items-center gap-2 bg-card border border-border rounded-md p-2 mb-4">
          <code className="text-xs font-mono text-foreground flex-1 truncate">
            {refLink}
          </code>
          <button
            onClick={() => handleCopy(refLink, t('referrals.linkLabel'))}
            className="px-2 py-1 bg-primary text-primary-foreground rounded text-xs flex items-center gap-1 shrink-0"
          >
            <Icon name="ClipboardDocumentIcon" size={12} />
            {t('referrals.copy')}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-md text-xs flex items-center gap-1"
          >
            <Icon name="PaperAirplaneIcon" size={12} />
            Telegram
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(refLink)}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-md text-xs flex items-center gap-1"
          >
            <Icon name="MegaphoneIcon" size={12} />
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(refLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-md text-xs flex items-center gap-1"
          >
            <Icon name="UsersIcon" size={12} />
            Facebook
          </a>
          <a
            href={`https://wa.me/?text=${shareText}%20${encodeURIComponent(refLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-card hover:bg-muted border border-border rounded-md text-xs flex items-center gap-1"
          >
            <Icon name="ChatBubbleLeftRightIcon" size={12} />
            WhatsApp
          </a>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon="CursorArrowRaysIcon"
          label={t('referrals.statClicks')}
          value={ref.clicks}
          color="text-primary"
        />
        <StatCard
          icon="UserPlusIcon"
          label={t('referrals.statSignups')}
          value={ref.signups}
          sub={t('referrals.conversion', { pct: ref.conversionPct })}
          color="text-success"
        />
        <StatCard
          icon="ShoppingCartIcon"
          label={t('referrals.statPaying')}
          value={ref.payingUsers}
          color="text-warning"
        />
        <StatCard
          icon="BanknotesIcon"
          label={t('referrals.statTotalEarned')}
          value={fmtUzs(ref.totalEarnedUzs, locale)}
          sub="UZS"
          color="text-success"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-warning/5 border border-warning/30 rounded-md p-4">
          <p className="text-xs text-muted-foreground">{t('referrals.pending')}</p>
          <p className="text-xl font-bold text-warning">
            {fmtUzs(ref.pendingEarningsUzs, locale)} UZS
          </p>
        </div>
        <div className="bg-success/5 border border-success/30 rounded-md p-4">
          <p className="text-xs text-muted-foreground">{t('referrals.paid')}</p>
          <p className="text-xl font-bold text-success">
            {fmtUzs(ref.paidEarningsUzs, locale)} UZS
          </p>
        </div>
      </div>

      <h2 className="text-lg font-medium mb-3">{t('referrals.earningsHistory')}</h2>

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => setStatusFilter(undefined)}
          className={`px-3 py-1 rounded-full text-xs ${
            !statusFilter
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          {t('referrals.filterAll')}
        </button>
        {(['pending', 'paid', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t(`referrals.status.${s}`)}
          </button>
        ))}
      </div>

      {earnings.isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-muted rounded-md" />
          ))}
        </div>
      ) : (earnings.data?.rows.length ?? 0) === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-md">
          <Icon
            name="BanknotesIcon"
            size={48}
            className="text-muted-foreground mx-auto mb-3"
          />
          <p className="text-muted-foreground text-sm">
            {t('referrals.empty')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {earnings.data?.rows.map((e) => (
            <div
              key={e.id}
              className="bg-card border border-border rounded-md p-3 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  STATUS_COLOR[e.status]
                }`}
              >
                <Icon name="BanknotesIcon" size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground truncate">
                    {e.referredUserName}
                  </p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      STATUS_COLOR[e.status]
                    }`}
                  >
                    {t(`referrals.status.${e.status}`)}
                  </span>
                </div>
                {e.courseTitle && (
                  <p className="text-xs text-muted-foreground truncate">
                    {e.courseTitle}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDate(e.createdAt, locale)} ·{' '}
                  {t('referrals.commission', { pct: e.commissionPct })}
                </p>
              </div>
              <p className="text-base font-bold text-success shrink-0">
                +{fmtUzs(e.amountUzs, locale)} UZS
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-6 bg-muted/30 rounded-md text-sm text-muted-foreground">
        <h3 className="font-medium text-foreground mb-2">{t('referrals.howTitle')}</h3>
        <ol className="space-y-1 list-decimal list-inside">
          <li>{t('referrals.step1')}</li>
          <li>{t('referrals.step2')}</li>
          <li>
            {t('referrals.step3Before')} <strong>{t('referrals.step3Bold')}</strong>{' '}
            {t('referrals.step3After')}
          </li>
          <li>{t('referrals.step4')}</li>
        </ol>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-md p-4">
      <Icon name={icon} size={20} className={`${color} mb-2`} />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
