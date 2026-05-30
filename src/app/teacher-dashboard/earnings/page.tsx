import { Suspense } from 'react';
import EarningsClient from './EarningsClient';

export const dynamic = 'force-dynamic';

export default function TeacherEarningsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <EarningsClient />
    </Suspense>
  );
}
