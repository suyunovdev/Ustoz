import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import ReviewsClient from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default function TeacherReviewsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReviewsClient />
    </Suspense>
  );
}
