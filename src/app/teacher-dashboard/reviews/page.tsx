import { Suspense } from 'react';
import ReviewsClient from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default function TeacherReviewsPage() {
  return (
    <Suspense fallback={<div className="p-8">Yuklanmoqda…</div>}>
      <ReviewsClient />
    </Suspense>
  );
}
