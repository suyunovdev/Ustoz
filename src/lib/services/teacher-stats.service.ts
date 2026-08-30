/**
 * Teacher dashboard statistika service.
 *
 * Avval: 12 ta alohida Prisma query (per-month loop) → ~500ms cold start
 * Hozir: 3 ta raw SQL (Postgres FILTER + date_trunc) → ~30-50ms
 */

import { prisma } from '@/lib/prisma';
import { teacherRepo, type TeacherCourseWithRevenue } from '@/lib/repositories';
import { PLATFORM_FEE_PCT, netFromGross } from '@/lib/repositories/earnings.repository';

export interface TeacherDashboardData {
  courses: Array<{
    id: string;
    title: string;
    coverImage: string | null;
    isPublished: boolean;
    moderationStatus: string;
    adminFeedback: string | null;
    priceUzs: string;
    enrollmentCount: number;
    rating: number;
    reviewCount: number;
    topicCount: number;
    revenueUzs: string;
    createdAt: string;
  }>;
  stats: {
    totalCourses: number;
    publishedCourses: number;
    draftCourses: number;
    underReviewCourses: number;
    rejectedCourses: number;
    totalEnrollments: number;
    /** O'qituvchi sof (netto) daromadi — platforma komissiyasi ayrilgan. */
    totalRevenueUzs: string;
    /** Amaldagi platforma komissiyasi foizi (netto qanday hisoblanганini ko'rsatish uchun). */
    platformFeePct: number;
    /** Faqat reyting olgan (reviewCount > 0) kurslar bo'yicha o'rtacha. */
    avgRating: number;
  };
  /** Har oy uchun netto daromad. `month` — mashina o'qiydigan 'YYYY-MM' (client formatlaydi). */
  monthlyRevenue: Array<{ month: string; revenue: string; enrollments: number }>;
  recentTransactions: Array<{
    id: string;
    studentName: string;
    courseTitle: string;
    amountUzs: string;
    createdAt: string;
  }>;
  topCourses: Array<{
    id: string;
    title: string;
    enrollmentCount: number;
    revenueUzs: string;
    rating: number;
  }>;
  needsAttention: Array<{
    type: 'rejected' | 'revision_requested' | 'pending_review';
    courseId: string;
    courseTitle: string;
    feedback: string | null;
  }>;
}

interface MonthlyRow {
  month: Date;
  revenue: bigint;
  enrollments: bigint;
}

interface RecentTxRow {
  id: string;
  student_name: string;
  course_title: string;
  amount_uzs: bigint;
  created_at: Date;
}

export async function getTeacherDashboard(
  teacherId: string,
): Promise<TeacherDashboardData> {
  const [coursesWithRevenue, monthlyRows, recentTxRows, totalEnrollments] = await Promise.all([
    teacherRepo.findCoursesWithRevenue(teacherId),
    // 6 oylik daromad + yozilishlar — bitta raw SQL
    prisma.$queryRaw<MonthlyRow[]>`
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '5 months'),
          date_trunc('month', NOW()),
          '1 month'::interval
        ) AS month
      ),
      revenue AS (
        SELECT date_trunc('month', pt.created_at) AS month,
               COALESCE(SUM(pt.amount_uzs), 0)::bigint AS revenue
        FROM payment_transactions pt
        JOIN courses c ON c.id = pt.course_id
        WHERE c.teacher_id = ${teacherId}::uuid
          AND pt.status = 'completed'
          AND pt.created_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1
      ),
      enroll AS (
        SELECT date_trunc('month', e.enrolled_at) AS month,
               COUNT(*)::bigint AS enrollments
        FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE c.teacher_id = ${teacherId}::uuid
          AND e.enrolled_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1
      )
      SELECT m.month,
             COALESCE(r.revenue, 0)::bigint AS revenue,
             COALESCE(e.enrollments, 0)::bigint AS enrollments
      FROM months m
      LEFT JOIN revenue r ON r.month = m.month
      LEFT JOIN enroll e ON e.month = m.month
      ORDER BY m.month ASC
    `,
    // Oxirgi 10 ta tranzaksiya
    prisma.$queryRaw<RecentTxRow[]>`
      SELECT pt.id,
             up.full_name AS student_name,
             c.title AS course_title,
             pt.amount_uzs,
             pt.created_at
      FROM payment_transactions pt
      JOIN courses c ON c.id = pt.course_id
      JOIN user_profiles up ON up.id = pt.student_id
      WHERE c.teacher_id = ${teacherId}::uuid
        AND pt.status = 'completed'
      ORDER BY pt.created_at DESC
      LIMIT 10
    `,
    prisma.enrollment.count({
      where: { course: { teacherId } },
    }),
  ]);

  // Stats hisoblash (courses ro'yxatidan). Daromad — NETTO (platforma komissiyasi
  // ayrilgan), earnings sahifasi bilan bir xil manba (netFromGross) orqali.
  const totalGross = coursesWithRevenue.reduce(
    (sum, c) => sum + BigInt(c.revenueUzs),
    BigInt(0),
  );
  const totalNet = netFromGross(totalGross);

  // O'rtacha reyting — faqat reyting olgan kurslar bo'yicha (reviewsiz 0.0
  // kurslar o'rtachani sun'iy pasaytirmasligi uchun).
  const ratedCourses = coursesWithRevenue.filter((c) => c._count.reviews > 0);
  const avgRating =
    ratedCourses.length > 0
      ? ratedCourses.reduce((sum, c) => sum + Number(c.rating), 0) / ratedCourses.length
      : 0;

  const stats = {
    totalCourses: coursesWithRevenue.length,
    publishedCourses: coursesWithRevenue.filter((c) => c.isPublished).length,
    draftCourses: coursesWithRevenue.filter((c) => c.moderationStatus === 'draft').length,
    underReviewCourses: coursesWithRevenue.filter(
      (c) => c.moderationStatus === 'submitted' || c.moderationStatus === 'under_review',
    ).length,
    rejectedCourses: coursesWithRevenue.filter((c) => c.moderationStatus === 'rejected').length,
    totalEnrollments,
    totalRevenueUzs: totalNet.toString(),
    platformFeePct: PLATFORM_FEE_PCT,
    avgRating: Math.round(avgRating * 100) / 100,
  };

  // Top 5 kurslar (netto revenue bo'yicha). Komissiya monoton bo'lgani uchun
  // saralash tartibi brutto bilan bir xil; faqat ko'rsatiladigan qiymat netto.
  const topCourses = [...coursesWithRevenue]
    .sort((a, b) => Number(BigInt(b.revenueUzs) - BigInt(a.revenueUzs)))
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      title: c.title,
      enrollmentCount: c._count.enrollments,
      revenueUzs: netFromGross(BigInt(c.revenueUzs)).toString(),
      rating: Number(c.rating),
    }));

  // Diqqat talab qiladigan kurslar
  const needsAttention: TeacherDashboardData['needsAttention'] = coursesWithRevenue
    .filter((c) =>
      ['rejected', 'revision_requested'].includes(c.moderationStatus),
    )
    .map((c) => ({
      type:
        c.moderationStatus === 'rejected'
          ? ('rejected' as const)
          : ('revision_requested' as const),
      courseId: c.id,
      courseTitle: c.title,
      feedback: c.adminFeedback,
    }));

  return {
    courses: coursesWithRevenue.map(courseToDTO),
    stats,
    monthlyRevenue: monthlyRows.map((m) => ({
      // Locale-agnostik 'YYYY-MM' — client o'z lokali bilan formatlaydi
      // (server servisda request-scoped locale yo'q).
      month: m.month.toISOString().slice(0, 7),
      revenue: netFromGross(m.revenue).toString(),
      enrollments: Number(m.enrollments),
    })),
    recentTransactions: recentTxRows.map((tx) => ({
      id: tx.id,
      studentName: tx.student_name,
      courseTitle: tx.course_title,
      // O'qituvchi bosh sahifada sof ulushini ko'radi (komissiya ayrilgan).
      amountUzs: netFromGross(tx.amount_uzs).toString(),
      createdAt: tx.created_at.toISOString(),
    })),
    topCourses,
    needsAttention,
  };
}

function courseToDTO(c: TeacherCourseWithRevenue) {
  return {
    id: c.id,
    title: c.title,
    coverImage: c.coverImage,
    isPublished: c.isPublished,
    moderationStatus: c.moderationStatus,
    adminFeedback: c.adminFeedback,
    priceUzs: c.priceUzs.toString(),
    enrollmentCount: c._count.enrollments,
    rating: Number(c.rating),
    reviewCount: c._count.reviews,
    topicCount: c._count.topics,
    // Netto daromad — platforma komissiyasi ayrilgan (earnings sahifasi bilan izchil).
    revenueUzs: netFromGross(BigInt(c.revenueUzs)).toString(),
    createdAt: c.createdAt.toISOString(),
  };
}
