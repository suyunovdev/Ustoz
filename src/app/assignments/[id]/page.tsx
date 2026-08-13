import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import StudentAssignmentClient from './StudentAssignmentClient';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StudentAssignmentClient assignmentId={id} />
    </Suspense>
  );
}
