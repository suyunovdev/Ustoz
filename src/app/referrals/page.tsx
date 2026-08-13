import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import ReferralsClient from './ReferralsClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.referralsTitle'),
    description: t('meta.referralsDesc'),
  };
}

export const dynamic = 'force-dynamic';

export default function ReferralsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReferralsClient />
    </Suspense>
  );
}
