import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import NotificationsClient from './NotificationsClient';

export const metadata: Metadata = {
  title: 'Bildirishnomalar',
  description: 'Kurslar, to\'lovlar va platformadagi yangiliklar haqida bildirishnomalarni ko\'ring.',
};

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotificationsClient />
    </Suspense>
  );
}
