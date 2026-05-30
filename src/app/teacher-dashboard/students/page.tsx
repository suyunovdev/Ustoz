import { Suspense } from 'react';
import StudentsListClient from './StudentsListClient';

export const dynamic = 'force-dynamic';

export default function TeacherStudentsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <StudentsListClient />
    </Suspense>
  );
}
