'use client';

/**
 * RouteError — segment darajasidagi umumiy error boundary UI.
 *
 * Har bir dinamik/ma'lumot yuklaydigan marshrut o'z `error.tsx`ida shuni
 * qayta eksport qiladi. Bu server fetch throw'i butun daraxtni (layout/nav)
 * qulatishining oldini oladi — xato faqat shu segment ichida ushlanadi.
 */
import { useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error('[RouteError]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <Icon name="ExclamationTriangleIcon" size={36} className="text-destructive" />
          </div>
        </div>

        <h2 className="text-xl font-heading font-semibold text-foreground mb-2">
          {t('ui.errorTitle')}
        </h2>
        <p className="text-muted-foreground mb-6">{t('ui.errorDesc')}</p>

        {process.env.NODE_ENV === 'development' && (
          <pre className="text-xs text-left bg-muted p-3 rounded mb-4 overflow-auto max-h-32">
            {error.message}
          </pre>
        )}

        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          <Icon name="ArrowPathIcon" size={16} />
          {t('ui.tryAgain')}
        </button>
      </div>
    </div>
  );
}
