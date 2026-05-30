import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  QueryClient,
  HydrationBoundary,
  dehydrate,
} from '@tanstack/react-query';

import AdminDashboardInteractive from './components/AdminDashboardInteractive';
import { getSession } from '@/lib/auth';
import { getDashboardStats } from '@/lib/services/admin-stats.service';

export const metadata: Metadata = {
  title: 'Admin paneli',
  description:
    "Platformani boshqaring, foydalanuvchilarni nazorat qiling, kurslarni kuzating.",
  robots: { index: false, follow: false },
};

// Har request'da yangi data — auth'ga bog'liq, personalized.
export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  // 1) Server-side auth tekshirish (RSC'da darrov, no flicker)
  const session = await getSession();
  if (!session) {
    redirect('/login?redirect=/admin-dashboard');
  }
  if (session.role !== 'admin') {
    redirect('/unauthorized');
  }

  // 2) Server'da KPI'larni prefetch — TanStack Query cache'ga uzatish uchun
  //    Client'da useAdminStats() darrov data oladi, loading flash yo'q.
  const queryClient = new QueryClient();
  try {
    await queryClient.prefetchQuery({
      queryKey: ['admin-stats'],
      queryFn: () => getDashboardStats(),
    });
  } catch (err) {
    // Prefetch xato bo'lsa ham sahifa render bo'ladi — client retry qiladi
    // eslint-disable-next-line no-console
    console.error('[AdminDashboardPage] prefetch failed:', err);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminDashboardInteractive />
    </HydrationBoundary>
  );
}
