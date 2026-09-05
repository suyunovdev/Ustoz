'use client';

import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency } from '@/lib/i18n/format';

interface Transaction {
  id: string;
  amount_uzs: number;
  payment_method: 'click' | 'payme';
  status: string;
  created_at: string;
}

interface PaymentStatsProps {
  transactions: Transaction[];
}

// Ikonka yo'llari (Lucide/Heroicons uslubi, outline)
const ICON = {
  check: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  card: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
  coin: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

function StatCard({
  icon, tint, iconColor, label, value,
}: { icon: string; tint: string; iconColor: string; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
      <span
        className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: tint, color: iconColor }}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </span>
      <div className="min-w-0">
        <div className="text-sm text-muted-foreground truncate">{label}</div>
        <div className="text-base font-semibold text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

export default function PaymentStats({ transactions }: PaymentStatsProps) {
  const { t, locale } = useI18n();
  const totalSpent = transactions
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount_uzs, 0);

  const completedCount = transactions.filter((t) => t.status === 'completed').length;
  const pendingCount = transactions.filter((t) => t.status === 'pending' || t.status === 'processing').length;
  const clickCount = transactions.filter((t) => t.payment_method === 'click' && t.status === 'completed').length;
  const paymeCount = transactions.filter((t) => t.payment_method === 'payme' && t.status === 'completed').length;

  const formatAmount = (amount: number) => formatCurrency(amount, locale, 'UZS');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Jami sarflangan — sahifaning asosiy raqami (Tun + nuqtali to'r + quyosh urg'u) */}
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg, var(--brand-blue), var(--brand-blue-deep))' }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.22]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1.1px, transparent 1.1px)',
            backgroundSize: '16px 16px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--brand-band-fg)' }}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON.coin} />
            </svg>
            {t('payment.totalSpent')}
          </div>
          <div
            className="mt-2 font-bold text-white leading-tight"
            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 2.4vw, 2rem)' }}
          >
            {formatAmount(totalSpent)}
          </div>
          <span className="mt-3 inline-block h-1 w-10 rounded-full" style={{ background: 'var(--brand-sun)' }} />
        </div>
      </div>

      {/* Muvaffaqiyatli — Bog' (yashil) */}
      <StatCard
        icon={ICON.check}
        tint="rgba(31,169,122,0.12)"
        iconColor="var(--brand-malachite)"
        label={t('payment.successful')}
        value={`${completedCount} ${t('payment.count')}`}
      />

      {/* Kutilmoqda — Quyosh tini + siyoh ikonka (oq matn quyoshga qo'yilmaydi) */}
      <StatCard
        icon={ICON.clock}
        tint="rgba(255,185,48,0.18)"
        iconColor="var(--brand-gold-on-surface)"
        label={t('payment.pending')}
        value={`${pendingCount} ${t('payment.count')}`}
      />

      {/* To'lov usullari — Tun (binafsha o'rniga brend rangi) */}
      <StatCard
        icon={ICON.card}
        tint="rgba(15,36,71,0.10)"
        iconColor="var(--brand-navy)"
        label={t('payment.paymentMethods')}
        value={`Click: ${clickCount} · Payme: ${paymeCount}`}
      />
    </div>
  );
}
