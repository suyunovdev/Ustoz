import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import ReferralsClient from './ReferralsClient';

export const metadata: Metadata = {
  title: 'Tavsiya dasturi',
  description: 'Do\'stlaringizni taklif qiling va mukofotlar oling. Tavsiya havolangizni ulashing va daromad ishlang.',
};

export const dynamic = 'force-dynamic';

export default function ReferralsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReferralsClient />
    </Suspense>
  );
}
