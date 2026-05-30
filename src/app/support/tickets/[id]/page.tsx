import { Suspense } from 'react';
import TicketDetailClient from './TicketDetailClient';

export const dynamic = 'force-dynamic';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <TicketDetailClient ticketId={id} />
    </Suspense>
  );
}
