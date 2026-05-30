/**
 * Admin dashboard statistics — bitta `getDashboardStats()` orqali yetib keladigan KPI'lar.
 *
 * Refactor (Phase 1.1):
 *   AVVAL: 10 ta alohida Prisma query (Promise.all) → cold start'da 2-5s
 *   HOZIR: 3 ta raw SQL (Postgres FILTER aggregation) → ~50-100ms
 *
 * Foydalanish:
 *   - Server Component (admin-dashboard/page.tsx) — to'g'ridan-to'g'ri chaqiradi
 *   - API route (GET /api/admin/stats) — bir xil funksiyani chaqiradi
 *   - TanStack Query (browser) — refetch uchun API'ga so'rov yuboradi
 */

import { prisma } from '@/lib/prisma';

export interface AdminDashboardStats {
  totalUsers: number;
  usersByRole: { student: number; teacher: number; admin: number };
  activeCourses: number;
  totalRevenueUzs: string;
  totalRevenueUsd: number;
  userGrowth: number;     // % vs prev 30 days
  courseGrowth: number;
  revenueGrowth: number;
  newUsersLast30d: number;
  newCoursesLast30d: number;
  pendingPayments: number;
}

const UZS_PER_USD = Number(process.env.NEXT_PUBLIC_UZS_PER_USD) || 12_700;

function growthPercent(now: number | bigint, prev: number | bigint): number {
  const n = Number(now);
  const p = Number(prev);
  if (p === 0) return n > 0 ? 100 : 0;
  return Math.round(((n - p) / p) * 100);
}

// Raw SQL row shape'lari — Prisma'da `$queryRaw` orqali olamiz.
interface UserAggRow {
  total: bigint;
  students: bigint;
  teachers: bigint;
  admins: bigint;
  new30: bigint;
  prev30: bigint;
}

interface CourseAggRow {
  active_total: bigint;
  new30: bigint;
  prev30: bigint;
}

interface PaymentAggRow {
  total_revenue: bigint;
  revenue_30d: bigint;
  revenue_prev30d: bigint;
  pending_count: bigint;
}

/**
 * Bitta sahifa uchun barcha admin KPI'lar.
 *
 * Postgres `FILTER` clause bitta jadval bo'yicha bir nechta agregat'ni
 * bitta scan'da qaytaradi → har jadvalga 1 ta query bilan tushadi.
 *
 * Performance:
 *   - 3 query parallel (Promise.all) — ~50-100ms warm DB
 *   - Indeks: created_at, status — barchasi mavjud (default)
 *   - Cache: keyingi qadamda Next.js `unstable_cache` + revalidate qo'shish mumkin
 */
export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const [userAgg, courseAgg, paymentAgg] = await Promise.all([
    prisma.$queryRaw<UserAggRow[]>`
      SELECT
        COUNT(*)::bigint AS total,
        COUNT(*) FILTER (WHERE role = 'student')::bigint AS students,
        COUNT(*) FILTER (WHERE role = 'teacher')::bigint AS teachers,
        COUNT(*) FILTER (WHERE role = 'admin')::bigint AS admins,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::bigint AS new30,
        COUNT(*) FILTER (
          WHERE created_at >= NOW() - INTERVAL '60 days'
            AND created_at <  NOW() - INTERVAL '30 days'
        )::bigint AS prev30
      FROM user_profiles
      WHERE deleted_at IS NULL
    `,
    prisma.$queryRaw<CourseAggRow[]>`
      SELECT
        COUNT(*) FILTER (WHERE is_published = true)::bigint AS active_total,
        COUNT(*) FILTER (WHERE is_published = true AND created_at >= NOW() - INTERVAL '30 days')::bigint AS new30,
        COUNT(*) FILTER (
          WHERE is_published = true
            AND created_at >= NOW() - INTERVAL '60 days'
            AND created_at <  NOW() - INTERVAL '30 days'
        )::bigint AS prev30
      FROM courses
    `,
    prisma.$queryRaw<PaymentAggRow[]>`
      SELECT
        COALESCE(SUM(amount_uzs) FILTER (WHERE status = 'completed'), 0)::bigint AS total_revenue,
        COALESCE(
          SUM(amount_uzs) FILTER (
            WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'
          ), 0
        )::bigint AS revenue_30d,
        COALESCE(
          SUM(amount_uzs) FILTER (
            WHERE status = 'completed'
              AND created_at >= NOW() - INTERVAL '60 days'
              AND created_at <  NOW() - INTERVAL '30 days'
          ), 0
        )::bigint AS revenue_prev30d,
        COUNT(*) FILTER (WHERE status IN ('pending', 'processing'))::bigint AS pending_count
      FROM payment_transactions
    `,
  ]);

  const u = userAgg[0];
  const c = courseAgg[0];
  const p = paymentAgg[0];

  const totalRevenueUzs = p.total_revenue;
  const totalRevenueUsd = Number(totalRevenueUzs) / UZS_PER_USD;

  return {
    totalUsers: Number(u.total),
    usersByRole: {
      student: Number(u.students),
      teacher: Number(u.teachers),
      admin: Number(u.admins),
    },
    activeCourses: Number(c.active_total),
    totalRevenueUzs: totalRevenueUzs.toString(),
    totalRevenueUsd: Math.round(totalRevenueUsd * 100) / 100,
    userGrowth: growthPercent(u.new30, u.prev30),
    courseGrowth: growthPercent(c.new30, c.prev30),
    revenueGrowth: growthPercent(p.revenue_30d, p.revenue_prev30d),
    newUsersLast30d: Number(u.new30),
    newCoursesLast30d: Number(c.new30),
    pendingPayments: Number(p.pending_count),
  };
}
