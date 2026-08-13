'use client';
import { useI18n } from '@/contexts/I18nContext';

export default function LoadingFallback({ className }: { className?: string }) {
  const { t } = useI18n();
  return <div className={className ?? 'p-8 text-center text-muted-foreground'}>{t('common.loading')}</div>;
}
