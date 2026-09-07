import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('meta.teacherAnalytics'), robots: { index: false, follow: false } };
}

export default function TeacherAnalyticsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnalyticsClient />
    </Suspense>
  );
}
