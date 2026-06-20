'use client';

import React from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useI18n } from '@/contexts/I18nContext';

export default function NotFound() {
    const { t } = useI18n();

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <h1 className="text-9xl font-bold text-primary opacity-20">404</h1>
                    </div>
                </div>

                <h2 className="text-2xl font-medium text-foreground mb-2">
                    {t('ui.notFoundTitle')}
                </h2>
                <p className="text-muted-foreground mb-8">
                    {t('ui.notFoundDesc')}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors duration-200 shadow-warm"
                    >
                        <Icon name="HomeIcon" size={16} />
                        {t('ui.goHome')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
