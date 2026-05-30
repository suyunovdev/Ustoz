import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CourseDetailInteractive from './CourseDetailInteractive';
import { getSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Kurs tafsilotlari',
  robots: { index: false, follow: false },
};

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
  return <CourseDetailInteractive courseId={id} />;
}
