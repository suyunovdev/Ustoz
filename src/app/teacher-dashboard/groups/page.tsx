import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import GroupsListClient from './GroupsListClient';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('meta.teacherGroups'), robots: { index: false, follow: false } };
}

export default function TeacherGroupsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GroupsListClient />
    </Suspense>
  );
}
