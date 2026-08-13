import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import TestsListClient from './TestsListClient';

export const dynamic = 'force-dynamic';

export default function TeacherTestsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TestsListClient />
    </Suspense>
  );
}
