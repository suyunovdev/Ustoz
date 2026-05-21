'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-error/10 flex items-center justify-center">
            <Icon name="ShieldExclamationIcon" size={48} className="text-error" />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-onBackground mb-2">403</h1>
        <h2 className="text-2xl font-medium text-onBackground mb-2">Ruxsat yo'q</h2>
        <p className="text-onBackground/70 mb-8">
          Bu sahifaga kirish uchun sizning rolingiz yetarli emas. Agar bu xato deb hisoblasangiz, admin bilan bog'laning.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors duration-200"
          >
            <Icon name="ArrowLeftIcon" size={16} />
            Orqaga
          </button>

          <button
            onClick={() => router.push('/course-marketplace')}
            className="inline-flex items-center justify-center gap-2 border border-border bg-background text-foreground px-6 py-3 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
          >
            <Icon name="HomeIcon" size={16} />
            Bosh sahifa
          </button>
        </div>
      </div>
    </div>
  );
}
