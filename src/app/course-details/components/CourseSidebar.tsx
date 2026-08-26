'use client';

import Icon from '@/components/ui/AppIcon';
import { toast } from '@/components/common/Toaster';
import { useI18n } from '@/contexts/I18nContext';
import { formatCurrency, formatDate, formatNumber } from '@/lib/i18n/format';

interface CourseSidebarProps {
  course: {
    title: string;
    pricing: {
      usd: number;
      uzs: number;
    };
    language: string;
    lastUpdated: string;
    totalDuration: string;
    enrollmentCount: number;
    lessonCount: number;
    hasCertificate: boolean;
  };
  onPurchase: () => void;
  isPurchasing: boolean;
  isEnrolled: boolean;
  discountPct?: number;
}

const CourseSidebar = ({ course, onPurchase, isPurchasing, isEnrolled, discountPct = 0 }: CourseSidebarProps) => {
  const { t, locale } = useI18n();

  const priceUzs = course.pricing.uzs;
  const hasDiscount = !isEnrolled && priceUzs > 0 && discountPct > 0 && discountPct < 100;
  const allAccessFree = !isEnrolled && priceUzs > 0 && discountPct >= 100;
  const finalUzs = hasDiscount ? Math.round((priceUzs * (100 - discountPct)) / 100) : priceUzs;

  const ctaLabel = isPurchasing
    ? t('courseDetails.loading')
    : isEnrolled
      ? t('courseDetails.continueLearning')
      : priceUzs === 0 || allAccessFree
        ? t('courseDetails.enrollFree')
        : t('courseDetails.buyCourse');

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t('courseDetails.linkCopied'));
    } catch {
      toast.error(t('courseDetails.copyFailed'));
    }
  };

  const handleTelegramShare = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(course.title);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const infoRows = [
    { icon: 'BookOpenIcon', label: t('courseDetails.lessons'), value: formatNumber(course.lessonCount, locale) },
    { icon: 'ClockIcon', label: t('courseDetails.duration'), value: course.totalDuration },
    { icon: 'UserGroupIcon', label: t('courseDetails.students'), value: formatNumber(course.enrollmentCount, locale) },
    { icon: 'LanguageIcon', label: t('courseDetails.language'), value: course.language },
    { icon: 'CalendarIcon', label: t('courseDetails.updated'), value: formatDate(course.lastUpdated, locale) },
  ];

  return (
    <div className="sticky top-24 space-y-4">
      {/* Pricing Card */}
      <div className="bg-card rounded-md shadow-warm-lg p-6 space-y-4">
        {allAccessFree ? (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-heading font-bold text-success">{t('courses.free')}</span>
              <span className="text-base text-muted-foreground line-through">{formatCurrency(priceUzs, locale, 'UZS')}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <Icon name="SparklesIcon" size={13} />
              {t('courseDetails.subFreeBadge')}
            </span>
          </div>
        ) : hasDiscount ? (
          <div className="space-y-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-heading font-bold text-primary">{formatCurrency(finalUzs, locale, 'UZS')}</span>
              <span className="text-base text-muted-foreground line-through">{formatCurrency(priceUzs, locale, 'UZS')}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
              <Icon name="SparklesIcon" size={13} />
              {t('courseDetails.subDiscountBadge', { pct: discountPct })}
            </span>
          </div>
        ) : (
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-heading font-bold text-primary">
              {priceUzs > 0 ? formatCurrency(priceUzs, locale, 'UZS') : t('courses.free')}
            </span>
          </div>
        )}

        <button
          onClick={onPurchase}
          disabled={isPurchasing}
          className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isEnrolled && <Icon name="PlayIcon" size={18} variant="solid" />}
          {ctaLabel}
        </button>

        {!isEnrolled && (
          <p className="text-xs text-center text-muted-foreground">
            {t('courseDetails.refundGuarantee')}
          </p>
        )}
      </div>

      {/* Course Info Card */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-4">
        <h3 className="font-heading font-semibold text-foreground">{t('courseDetails.courseInfo')}</h3>

        <div className="space-y-3">
          {infoRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Icon name={row.icon} size={18} />
                <span className="text-sm">{row.label}</span>
              </div>
              <span className="text-sm font-medium text-foreground">{row.value}</span>
            </div>
          ))}

          {course.hasCertificate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Icon name="AcademicCapIcon" size={18} />
                <span className="text-sm">{t('courseDetails.certificate')}</span>
              </div>
              <Icon name="CheckCircleIcon" size={18} variant="solid" className="text-success" />
            </div>
          )}
        </div>
      </div>

      {/* Share Card */}
      <div className="bg-card rounded-md shadow-warm p-6 space-y-3">
        <h3 className="font-heading font-semibold text-foreground">{t('courseDetails.share')}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleTelegramShare}
            aria-label={t('courseDetails.shareTelegram')}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-muted rounded-md hover:bg-muted/80 transition-smooth text-sm text-foreground"
          >
            <Icon name="PaperAirplaneIcon" size={18} />
            Telegram
          </button>
          <button
            onClick={handleCopyLink}
            aria-label={t('courseDetails.copyLink')}
            className="flex-1 flex items-center justify-center gap-2 p-2 bg-muted rounded-md hover:bg-muted/80 transition-smooth text-sm text-foreground"
          >
            <Icon name="LinkIcon" size={18} />
            {t('courseDetails.copyLink')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseSidebar;
