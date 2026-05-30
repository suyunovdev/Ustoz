import { Suspense } from 'react';
import StudentAssignmentClient from './StudentAssignmentClient';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <StudentAssignmentClient assignmentId={id} />
    </Suspense>
  );
}
