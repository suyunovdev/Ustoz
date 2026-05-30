import { Suspense } from 'react';
import GroupDetailClient from './GroupDetailClient';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <GroupDetailClient groupId={id} />
    </Suspense>
  );
}
