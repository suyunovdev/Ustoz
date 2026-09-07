import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import ReviewsClient from './ReviewsClient';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('meta.teacherReviews'), robots: { index: false, follow: false } };
}

export default function TeacherReviewsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReviewsClient />
    </Suspense>
  );
}
