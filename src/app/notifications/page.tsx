import { Suspense } from 'react';
import NotificationsClient from './NotificationsClient';

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <NotificationsClient />
    </Suspense>
  );
}
