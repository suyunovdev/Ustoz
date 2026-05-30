import { Suspense } from 'react';
import ReferralsClient from './ReferralsClient';

export const dynamic = 'force-dynamic';

export default function ReferralsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <ReferralsClient />
    </Suspense>
  );
}
