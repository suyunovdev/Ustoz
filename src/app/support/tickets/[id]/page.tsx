import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import TicketDetailClient from './TicketDetailClient';

export const dynamic = 'force-dynamic';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TicketDetailClient ticketId={id} />
    </Suspense>
  );
}
