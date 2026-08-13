import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import HelpClient from './HelpClient';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.helpTitle'),
    description: t('meta.helpDesc'),
  };
}

export const dynamic = 'force-dynamic';

export default function HelpPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HelpClient />
    </Suspense>
  );
}
