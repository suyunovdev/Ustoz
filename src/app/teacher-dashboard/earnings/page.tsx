import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import EarningsClient from './EarningsClient';

export const dynamic = 'force-dynamic';

export default function TeacherEarningsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <EarningsClient />
    </Suspense>
  );
}
