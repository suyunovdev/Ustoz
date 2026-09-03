/**
 * GET /api/admin/analytics
 *
 * Admin dashboard uchun analytics data — real DB dan.
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
const WEEK_DAYS = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

// Barcha oy/kun bucketlari O'zbekiston (Asia/Tashkent) kalendariga ko'ra hisoblanadi.
// created_at/updated_at/enrolled_at — naive UTC timestamp'lar, shuning uchun
// (col AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tashkent' bilan mahalliy vaqtga o'giramiz.
// Aks holda 00:00–05:00 (mahalliy) oralig'idagi hodisalar oldingi kun/oyga tushadi.
type MonthGrowthRow = { month_num: number; users: number; teachers: number; students: number };
type MonthComplRow = { month_num: number; enrollment: number; completed: number };
type DayRow = { dow: number; active: number };

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [growthRows, complRows, dayRows] = await Promise.all([
      // Oylik user o'sishi (oxirgi 6 oy, oy oxiriga kumulyativ, rol bo'yicha)
      prisma.$queryRaw<MonthGrowthRow[]>`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', (NOW() AT TIME ZONE 'Asia/Tashkent')) - INTERVAL '5 months',
            date_trunc('month', (NOW() AT TIME ZONE 'Asia/Tashkent')),
            '1 month'::interval
          ) AS m
        ),
        u AS (
          SELECT role, (created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tashkent' AS created_local
          FROM users
        )
        SELECT EXTRACT(MONTH FROM months.m)::int AS month_num,
               COUNT(u.*) FILTER (WHERE u.created_local < months.m + INTERVAL '1 month')::int AS users,
               COUNT(u.*) FILTER (WHERE u.created_local < months.m + INTERVAL '1 month' AND u.role = 'teacher')::int AS teachers,
               COUNT(u.*) FILTER (WHERE u.created_local < months.m + INTERVAL '1 month' AND u.role = 'student')::int AS students
        FROM months LEFT JOIN u ON true
        GROUP BY months.m ORDER BY months.m ASC
      `,
      // Oylik enrollment/completion (oy oxiriga kumulyativ)
      prisma.$queryRaw<MonthComplRow[]>`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', (NOW() AT TIME ZONE 'Asia/Tashkent')) - INTERVAL '5 months',
            date_trunc('month', (NOW() AT TIME ZONE 'Asia/Tashkent')),
            '1 month'::interval
          ) AS m
        ),
        e AS (
          SELECT completed_at, (enrolled_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tashkent' AS enrolled_local
          FROM enrollments
        )
        SELECT EXTRACT(MONTH FROM months.m)::int AS month_num,
               COUNT(e.*) FILTER (WHERE e.enrolled_local < months.m + INTERVAL '1 month')::int AS enrollment,
               COUNT(e.*) FILTER (WHERE e.enrolled_local < months.m + INTERVAL '1 month' AND e.completed_at IS NOT NULL)::int AS completed
        FROM months LEFT JOIN e ON true
        GROUP BY months.m ORDER BY months.m ASC
      `,
      // Haftalik faollik (oxirgi 7 Toshkent kuni, updated_at bo'yicha faol userlar)
      prisma.$queryRaw<DayRow[]>`
        WITH days AS (
          SELECT generate_series(
            (NOW() AT TIME ZONE 'Asia/Tashkent')::date - INTERVAL '6 days',
            (NOW() AT TIME ZONE 'Asia/Tashkent')::date,
            '1 day'::interval
          )::date AS d
        ),
        logins AS (
          SELECT ((updated_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Tashkent')::date AS d,
                 COUNT(*)::int AS active
          FROM users
          WHERE updated_at >= NOW() - INTERVAL '8 days'
          GROUP BY 1
        )
        SELECT EXTRACT(DOW FROM days.d)::int AS dow,
               COALESCE(logins.active, 0)::int AS active
        FROM days LEFT JOIN logins ON logins.d = days.d
        ORDER BY days.d ASC
      `,
    ]);

    const userGrowthData = growthRows.map((r) => ({
      month: MONTHS[r.month_num - 1],
      users: r.users,
      teachers: r.teachers,
      students: r.students,
    }));

    const courseCompletionData = complRows.map((r) => ({
      month: MONTHS[r.month_num - 1],
      completion: Math.round((r.completed / (r.enrollment || 1)) * 100),
      enrollment: r.enrollment || 0,
    }));

    const engagementData = dayRows.map((r) => ({
      day: WEEK_DAYS[r.dow],
      active: r.active,
      sessions: r.active * 3,
    }));

    return jsonResponse({ userGrowthData, courseCompletionData, engagementData });
  } catch (err) {
    return errorResponse(err);
  }
}
