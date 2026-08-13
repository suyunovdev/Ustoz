import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';
import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import ProfileClient from './ProfileClient';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.profileTitle'),
    description: t('meta.profileDesc'),
  };
}

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProfileClient />
    </Suspense>
  );
}
