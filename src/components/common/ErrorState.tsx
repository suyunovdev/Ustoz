'use client';
/**
 * ErrorState — fetch/query xatosi uchun standart UI (retry bilan).
 * "Xato = bo'sh holat" anti-pattern'ni almashtiradi.
 */
import Icon from '@/components/ui/AppIcon';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/contexts/I18nContext';

export default function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={className ?? 'min-h-[40vh] flex flex-col items-center justify-center p-8 text-center'} role="alert">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <Icon name="ExclamationTriangleIcon" size={36} className="text-destructive" />
      </div>
      <h3 className="text-lg font-heading font-semibold text-foreground mb-1">{t('ui.errorTitle')}</h3>
      <p className="text-muted-foreground mb-5 max-w-sm">{message || t('ui.errorDesc')}</p>
      {onRetry && (
        <Button variant="primary" size="md" iconLeft="ArrowPathIcon" onClick={onRetry}>
          {t('ui.tryAgain')}
        </Button>
      )}
    </div>
  );
}
