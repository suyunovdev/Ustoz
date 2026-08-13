import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default function TeacherAnalyticsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AnalyticsClient />
    </Suspense>
  );
}
