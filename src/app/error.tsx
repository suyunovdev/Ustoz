'use client';

import React from 'react';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Icon
              name="ExclamationTriangleIcon"
              size={40}
              className="text-destructive"
            />
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-2">
          {t('ui.errorTitle')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t('ui.errorDesc')}
        </p>

        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors duration-200 shadow-warm"
        >
          <Icon name="ArrowPathIcon" size={16} />
          {t('ui.tryAgain')}
        </button>
      </div>
    </div>
  );
}
