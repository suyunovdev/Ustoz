import type { Metadata } from 'next';
import { Suspense } from 'react';
import CourseDetailsInteractive from './components/CourseDetailsInteractive';
import { getServerT } from '@/lib/i18n/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const t = await getServerT();
  const { id } = await params;
  return {
    title: t('meta.courseDetailsTitle'),
    description: t('meta.courseDetailsDesc'),
    alternates: { canonical: `/courses/${id}` },
    openGraph: {
      title: t('meta.courseDetailsOgTitle'),
      description: t('meta.courseDetailsOgDesc'),
      type: 'article',
    },
  };
}

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <CourseDetailsInteractive courseId={id} />
    </Suspense>
  );
}
