import { Suspense } from 'react';
import TicketsListClient from './TicketsListClient';

export const dynamic = 'force-dynamic';

export default function MyTicketsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <TicketsListClient />
    </Suspense>
  );
}
