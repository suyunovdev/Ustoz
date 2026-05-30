import { Suspense } from 'react';
import TakeTestClient from './TakeTestClient';

export const dynamic = 'force-dynamic';

export default async function TakeTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <TakeTestClient testId={id} />
    </Suspense>
  );
}
