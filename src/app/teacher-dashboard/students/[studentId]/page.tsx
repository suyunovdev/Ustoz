import { Suspense } from 'react';
import StudentDetailClient from './StudentDetailClient';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <StudentDetailClient studentId={studentId} />
    </Suspense>
  );
}
