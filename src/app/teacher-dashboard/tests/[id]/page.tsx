import { Suspense } from 'react';
import TestBuilderClient from './TestBuilderClient';

export const dynamic = 'force-dynamic';

export default async function TestBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <TestBuilderClient testId={id} />
    </Suspense>
  );
}
