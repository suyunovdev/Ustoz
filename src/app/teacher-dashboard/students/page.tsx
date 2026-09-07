import { Suspense } from 'react';
import LoadingFallback from '@/components/common/LoadingFallback';
import StudentsListClient from './StudentsListClient';

export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return { title: t('meta.teacherStudents'), robots: { index: false, follow: false } };
}

export default function TeacherStudentsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StudentsListClient />
    </Suspense>
  );
}
