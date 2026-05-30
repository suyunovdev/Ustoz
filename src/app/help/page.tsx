import { Suspense } from 'react';
import HelpClient from './HelpClient';

export const dynamic = 'force-dynamic';

export default function HelpPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <HelpClient />
    </Suspense>
  );
}
