import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import PublicTeacherClient from './PublicTeacherClient';

export const dynamic = 'force-dynamic';

export default async function PublicTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PublicTeacherClient teacherId={id} />
    </Suspense>
  );
}
