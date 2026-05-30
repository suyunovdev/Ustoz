import { Suspense } from 'react';
import AssignmentsListClient from './AssignmentsListClient';

export const dynamic = 'force-dynamic';

export default function TeacherAssignmentsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <AssignmentsListClient />
    </Suspense>
  );
}
