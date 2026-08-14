import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getServerT } from '@/lib/i18n/server';
import { redirect } from 'next/navigation';
import CourseDetailInteractive from './CourseDetailInteractive';
import LoadingFallback from '@/components/common/LoadingFallback';
import { getSession } from '@/lib/auth';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getServerT();
  return {
    title: t('meta.courseDetailTitle'),
    robots: { index: false, follow: false },
  };
}

export const dynamic = 'force-dynamic';

export default async function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/teacher-dashboard');
  if (session.role !== 'teacher' && session.role !== 'admin') {
    redirect('/unauthorized');
  }
  const { id } = await params;
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CourseDetailInteractive courseId={id} />
    </Suspense>
  );
}
