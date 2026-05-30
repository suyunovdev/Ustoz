import { Suspense } from 'react';
import ResultClient from './ResultClient';

export const dynamic = 'force-dynamic';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id, attemptId } = await params;
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <ResultClient testId={id} attemptId={attemptId} />
    </Suspense>
  );
}
