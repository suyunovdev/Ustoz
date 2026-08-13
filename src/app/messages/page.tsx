import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import MessagesClient from './MessagesClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.messagesTitle'),
    description: t('meta.messagesDesc'),
  };
}

export const dynamic = 'force-dynamic';

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <MessagesClient />
    </Suspense>
  );
}
