import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import GroupsListClient from './GroupsListClient';

export const dynamic = 'force-dynamic';

export default function TeacherGroupsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <GroupsListClient />
    </Suspense>
  );
}
