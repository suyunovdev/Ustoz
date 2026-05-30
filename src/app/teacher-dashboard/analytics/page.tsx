import { Suspense } from 'react';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default function TeacherAnalyticsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <AnalyticsClient />
    </Suspense>
  );
}
