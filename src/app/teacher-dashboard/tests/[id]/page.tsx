import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import TestBuilderClient from './TestBuilderClient';

export const dynamic = 'force-dynamic';

export default async function TestBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <TestBuilderClient testId={id} />
    </Suspense>
  );
}
