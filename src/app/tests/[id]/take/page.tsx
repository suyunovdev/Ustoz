import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import TakeTestClient from './TakeTestClient';

export const dynamic = 'force-dynamic';

export default async function TakeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TakeTestClient testId={id} />
    </Suspense>
  );
}
