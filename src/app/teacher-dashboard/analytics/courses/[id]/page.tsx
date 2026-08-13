import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import CourseAnalyticsClient from './CourseAnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CourseAnalyticsClient courseId={id} />
    </Suspense>
  );
}
