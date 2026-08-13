import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import StudentDetailClient from './StudentDetailClient';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StudentDetailClient studentId={studentId} />
    </Suspense>
  );
}
