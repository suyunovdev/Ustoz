import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import TicketsListClient from './TicketsListClient';

export const dynamic = 'force-dynamic';

export default function MyTicketsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TicketsListClient />
    </Suspense>
  );
}
