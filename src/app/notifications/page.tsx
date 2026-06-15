import type { Metadata } from 'next';
import { Suspense } from 'react';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = {
  title: 'Bildirishnomalar',
  description: 'Kurslar, to\'lovlar va platformadagi yangiliklar haqida bildirishnomalarni ko\'ring.',
};

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <NotificationsClient />
    </Suspense>
  );
}
