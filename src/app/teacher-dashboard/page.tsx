import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from '@tanstack/react-query';

import TeacherDashboardInteractive from './components/TeacherDashboardInteractive';
import { getSession } from '@/lib/auth';
import { getTeacherDashboard } from '@/lib/services/teacher-stats.service';
import { queryKeys } from '@/hooks/queries/queryKeys';

export const metadata: Metadata = {
  title: "O'qituvchi paneli",
  description:
    "Kurslaringizni boshqaring, daromadingizni kuzating va talabalar faolligini tahlil qiling.",
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function TeacherDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect('/login?redirect=/teacher-dashboard');
  }
  if (session.role !== 'teacher' && session.role !== 'admin') {
    redirect('/unauthorized');
  }

  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.teacherDashboard,
      queryFn: () => getTeacherDashboard(session.sub),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[TeacherDashboardPage] prefetch failed:', err);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TeacherDashboardInteractive />
    </HydrationBoundary>
  );
}
