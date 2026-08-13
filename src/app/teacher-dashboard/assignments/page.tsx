import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import AssignmentsListClient from './AssignmentsListClient';

export const dynamic = 'force-dynamic';

export default function TeacherAssignmentsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AssignmentsListClient />
    </Suspense>
  );
}
