import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from '@tanstack/react-query';

import RoleBasedHeader from '@/components/common/RoleBasedHeader';
import StudentDashboardInteractive from './components/StudentDashboardInteractive';
import { getSession } from '@/lib/auth';
import { loadDashboardData } from '@/lib/services/dashboard.service';
import { queryKeys } from '@/hooks/queries/queryKeys';

export const metadata: Metadata = {
  title: 'Dashboard',
  description:
    "O'qish jarayonini kuzating, sotib olgan kurslaringizga kiring va yangi tavsiyalarni toping.",
  robots: { index: false, follow: false },
};

// Har request'da yangi data — auth bo'yicha personalized.
export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  // 1) Server-side auth tekshirish
  const session = await getSession();
  if (!session) {
    redirect('/login?redirect=/student-dashboard');
  }
  if (session.role !== 'student' && session.role !== 'admin') {
    redirect('/unauthorized');
  }

  // 2) Server'da data prefetch — TanStack Query cache'ga uzatish uchun
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.studentDashboard,
      queryFn: () => loadDashboardData(session.sub),
    });
  } catch (err) {
    // Prefetch xatosi — sahifa baribir render bo'ladi, client refetch qiladi
    console.error('[StudentDashboardPage] prefetch failed:', err);
  }

  const dehydratedState = dehydrate(queryClient);

  return (
    <>
      <RoleBasedHeader userRole="student" currentPath="/student-dashboard" />
      <HydrationBoundary state={dehydratedState}>
        <StudentDashboardInteractive />
      </HydrationBoundary>
    </>
  );
}
