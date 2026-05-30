import { Suspense } from 'react';
import PublicTeacherClient from './PublicTeacherClient';

export const dynamic = 'force-dynamic';

export default async function PublicTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <PublicTeacherClient teacherId={id} />
    </Suspense>
  );
}
