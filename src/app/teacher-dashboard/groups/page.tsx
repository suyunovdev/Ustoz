import { Suspense } from 'react';
import GroupsListClient from './GroupsListClient';

export const dynamic = 'force-dynamic';

export default function TeacherGroupsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <GroupsListClient />
    </Suspense>
  );
}
