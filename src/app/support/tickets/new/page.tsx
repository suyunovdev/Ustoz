import { Suspense } from 'react';
import NewTicketClient from './NewTicketClient';

export const dynamic = 'force-dynamic';

export default function NewTicketPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <NewTicketClient />
    </Suspense>
  );
}
