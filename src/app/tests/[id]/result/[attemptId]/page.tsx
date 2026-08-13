import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import ResultClient from './ResultClient';

export const dynamic = 'force-dynamic';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultClient testId={id} attemptId={attemptId} />
    </Suspense>
  );
}
