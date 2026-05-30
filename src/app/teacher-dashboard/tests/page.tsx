import { Suspense } from 'react';
import TestsListClient from './TestsListClient';

export const dynamic = 'force-dynamic';

export default function TeacherTestsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <TestsListClient />
    </Suspense>
  );
}
