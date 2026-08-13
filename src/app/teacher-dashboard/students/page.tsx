import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import StudentsListClient from './StudentsListClient';

export const dynamic = 'force-dynamic';

export default function TeacherStudentsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StudentsListClient />
    </Suspense>
  );
}
