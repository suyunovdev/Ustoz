import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import NewTicketClient from './NewTicketClient';

export const dynamic = 'force-dynamic';

export default function NewTicketPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewTicketClient />
    </Suspense>
  );
}
