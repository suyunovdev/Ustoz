import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import NotificationsClient from './NotificationsClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.notificationsTitle'),
    description: t('meta.notificationsDesc'),
  };
}

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NotificationsClient />
    </Suspense>
  );
}
