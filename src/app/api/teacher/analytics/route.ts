import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/analytics
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const teacherId = session.sub;

  // Jami daromad
  const totalRevenue = await prisma.paymentTransaction.aggregate({
    where: { course: { teacherId }, status: 'completed' },
    _sum: { amountUzs: true },
  });

  // Jami enrollment
  const totalEnrollments = await prisma.enrollment.count({
    where: { course: { teacherId } },
  });

  // Completion rate (progress = 100)
  const completedEnrollments = await prisma.enrollment.count({
    where: { course: { teacherId }, progress: 100 },
  });

  const completionRate =
    totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

  // Oxirgi 6 oy daromad grafigi
  const now = new Date();
  const revenueChart = [];
  for (let i = 5; i >= 0; i--) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthName = startOfMonth.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' });

    const rev = await prisma.paymentTransaction.aggregate({
      where: {
        course: { teacherId },
        status: 'completed',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amountUzs: true },
    });

    const enrCount = await prisma.enrollment.count({
      where: {
        course: { teacherId },
        enrolledAt: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    revenueChart.push({
      month: monthName,
      revenue: Number(rev._sum.amountUzs ?? 0),
      enrollments: enrCount,
    });
  }

  // Top kurslar
  const courses = await prisma.course.findMany({
    where: { teacherId },
    include: { _count: { select: { enrollments: true } } },
  });

  const topCourses = courses
    .map(c => ({
      id: c.id,
      title: c.title,
      enrollmentCount: c._count.enrollments,
      rating: Number(c.rating),
      isPublished: c.isPublished,
    }))
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, 5);

  // O'rtacha reyting
  const avgRating =
    courses.length > 0
      ? courses.reduce((sum, c) => sum + Number(c.rating), 0) / courses.length
      : 0;

  return jsonResponse({
    totalRevenueUzs: (totalRevenue._sum.amountUzs ?? BigInt(0)).toString(),
    totalEnrollments,
    completedEnrollments,
    completionRate,
    totalCourses: courses.length,
    publishedCourses: courses.filter(c => c.isPublished).length,
    avgRating: Math.round(avgRating * 10) / 10,
    revenueChart,
    topCourses,
  });
}
