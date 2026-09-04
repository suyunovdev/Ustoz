'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatDate } from '@/lib/i18n/format';
import { SkeletonCardGrid } from '@/components/ui/Skeleton';
import ErrorState from '@/components/common/ErrorState';
import { toast } from '@/components/common/Toaster';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  priceUzs: string;
  durationDays: number;
  tier: number;
  features: string[];
  allCoursesAccess: boolean;
  sortOrder: number;
}

interface MySubscription {
  id: string;
  status: string;
  startedAt: string;
  expiresAt: string;
  plan: Plan;
}

type PaymentMethod = 'click' | 'payme';

const SubscriptionInteractive = () => {
  const { t, locale } = useI18n();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<MySubscription | null>(null);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<PaymentMethod | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const [plansRes, myRes] = await Promise.all([
        fetch('/api/subscriptions/plans', { credentials: 'include' }),
        fetch('/api/subscriptions/my', { credentials: 'include' }),
      ]);

      if (plansRes.status === 401 || myRes.status === 401) {
        router.push('/login?redirect=/student-subscription');
        return;
      }

      if (!plansRes.ok) {
        throw new Error(`HTTP ${plansRes.status}`);
      }

      const data = await plansRes.json();
      const list: Plan[] = (data.plans || []).slice().sort(
        (a: Plan, b: Plan) => a.sortOrder - b.sortOrder,
      );
      setPlans(list);

      if (myRes.ok) {
        const myData = await myRes.json();
        setCurrent(myData.subscription ?? null);
      }
    } catch (err) {
      console.error('Obuna maʼlumotlarini yuklashda xato:', err);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePay = async (planId: string, method: PaymentMethod) => {
    if (processing) return;
    setProcessing(method);
    try {
      const res = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId, paymentMethod: method }),
      });
      if (res.status === 401) {
        router.push('/login?redirect=/student-subscription');
        return;
      }
      const data = await res.json();
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      console.error('Toʻlovni boshlashda xato:', data);
      // To'lov shlyuzi hali sozlanmagan — foydalanuvchini administrator (qo'lda
      // obuna) tomon yo'naltiramiz. Aks holda server xabari yoki umumiy xato.
      if (data.code === 'GATEWAY_NOT_CONFIGURED') {
        toast.error(t('subscription.paymentUnavailable'));
      } else {
        toast.error(typeof data.error === 'string' ? data.error : t('subscription.paymentInitFailed'));
      }
      setProcessing(null);
    } catch (err) {
      console.error('Toʻlovni boshlashda xato:', err);
      toast.error(t('subscription.paymentInitFailed'));
      setProcessing(null);
    }
  };

  const hasActive = current !== null && current.status === 'active';
  const popularPlanId =
    plans.length > 0
      ? plans.reduce((top, p) => (p.tier > top.tier ? p : top), plans[0]).id
      : null;

  return (
    <main className="min-h-screen bg-background pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-xl">
              <Icon name="SparklesIcon" size={26} className="text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">
                {t('subscription.title')}
              </h1>
              <p className="text-sm text-muted-foreground">{t('subscription.subtitle')}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="h-28 bg-card border border-border rounded-2xl animate-pulse" />
            <SkeletonCardGrid count={3} />
          </div>
        ) : loadError ? (
          <ErrorState onRetry={load} />
        ) : (
          <>
            {/* Current subscription / no active */}
            {hasActive && current ? (
              <section className="mb-10 relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-warm">
                <div
                  className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full bg-primary/10 blur-2xl"
                  aria-hidden="true"
                />
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl shrink-0 shadow-warm">
                      <Icon name="CheckBadgeIcon" size={26} className="text-primary-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">
                          {t('subscription.currentPlan')}
                        </p>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/15 text-success px-2 py-0.5 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          {t('subscription.active')}
                        </span>
                      </div>
                      <h2 className="text-xl font-heading font-semibold text-foreground">
                        {current.plan.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t('subscription.activeUntil')}:{' '}
                        <span className="font-medium text-foreground">
                          {formatDate(current.expiresAt, locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="mb-10 flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-warm">
                <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-lg shrink-0">
                  <Icon name="InformationCircleIcon" size={22} className="text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">{t('subscription.noActive')}</p>
              </section>
            )}

            {/* Plans */}
            <div className="mb-5">
              <h2 className="text-lg font-heading font-semibold text-foreground">
                {t('subscription.choose')}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {plans.map((plan) => {
                const isPopular = plan.id === popularPlanId;
                const isCurrent = hasActive && current?.plan.id === plan.id;
                const isChooserOpen = openPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl border bg-card p-6 transition-smooth ${
                      isPopular
                        ? 'border-primary/50 shadow-warm-lg ring-1 ring-primary/20'
                        : 'border-border shadow-warm hover:shadow-warm-lg'
                    }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-warm">
                        <Icon name="StarIcon" variant="solid" size={13} />
                        {t('subscription.popular')}
                      </span>
                    )}

                    {/* Name + access badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-lg font-heading font-semibold text-foreground">
                        {plan.name}
                      </h3>
                      {plan.allCoursesAccess && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 text-secondary px-2 py-0.5 text-xs font-medium whitespace-nowrap">
                          <Icon name="Squares2X2Icon" size={12} />
                          {t('subscription.allAccessBadge')}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-end gap-1.5">
                        <span className="text-3xl font-bold text-foreground leading-none">
                          {formatCurrency(Number(plan.priceUzs), locale, 'UZS')}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        / {t('subscription.perPeriodDays', { days: plan.durationDays })}
                      </span>
                    </div>

                    {plan.description && (
                      <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>
                    )}

                    {/* Features */}
                    {plan.features?.length > 0 && (
                      <div className="mb-6">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
                          {t('subscription.features')}
                        </p>
                        <ul className="space-y-2.5">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                              <Icon
                                name="CheckCircleIcon"
                                variant="solid"
                                size={18}
                                className="text-primary shrink-0 mt-0.5"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA / payment chooser */}
                    <div className="mt-auto pt-2">
                      {isChooserOpen ? (
                        <div className="rounded-xl border border-border bg-muted/40 p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2.5">
                            {t('subscription.selectMethod')}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {(['click', 'payme'] as PaymentMethod[]).map((method) => (
                              <button
                                key={method}
                                type="button"
                                onClick={() => handlePay(plan.id, method)}
                                disabled={processing !== null}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground transition-smooth hover:border-primary/50 hover:bg-primary/5 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {processing === method ? (
                                  <Icon
                                    name="ArrowPathIcon"
                                    size={16}
                                    className="animate-spin text-primary"
                                  />
                                ) : (
                                  <Icon name="CreditCardIcon" size={16} className="text-primary" />
                                )}
                                <span>
                                  {processing === method
                                    ? t('subscription.processing')
                                    : method === 'click'
                                      ? 'Click'
                                      : 'Payme'}
                                </span>
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpenPlanId(null)}
                            disabled={processing !== null}
                            className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-smooth disabled:opacity-60"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setOpenPlanId(plan.id)}
                          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-smooth ${
                            isPopular
                              ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-warm'
                              : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                          }`}
                        >
                          <Icon name={isCurrent ? 'ArrowPathIcon' : 'SparklesIcon'} size={17} />
                          {isCurrent ? t('subscription.renew') : t('subscription.subscribe')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default SubscriptionInteractive;
