import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/dashboard — Teacher uchun dashboard ma'lumotlari
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const teacherId = session.sub;

  // Teacher kurslarini olish (enrollment soni bilan)
  const courses = await prisma.course.findMany({
    where: { teacherId },
    include: {
      _count: { select: { enrollments: true } },
      reviews: { select: { rating: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Jami enrollment soni
  const totalEnrollments = await prisma.enrollment.count({
    where: { course: { teacherId } },
  });

  // Jami to'lovlar (completed)
  const paymentsAgg = await prisma.paymentTransaction.aggregate({
    where: {
      course: { teacherId },
      status: 'completed',
    },
    _sum: { amountUzs: true },
  });

  const totalRevenueUzs = paymentsAgg._sum.amountUzs ?? BigInt(0);

  // Oxirgi 6 oy daromad (oylik)
  const now = new Date();
  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthName = date.toLocaleDateString('uz-UZ', { month: 'short' });

    const agg = await prisma.paymentTransaction.aggregate({
      where: {
        course: { teacherId },
        status: 'completed',
        createdAt: { gte: date, lte: endDate },
      },
      _sum: { amountUzs: true },
    });

    monthlyRevenue.push({
      month: monthName,
      revenue: Number(agg._sum.amountUzs ?? 0) / 100, // tiyin → so'm
      enrollments: await prisma.enrollment.count({
        where: {
          course: { teacherId },
          enrolledAt: { gte: date, lte: endDate },
        },
      }),
    });
  }

  // Oxirgi to'lovlar
  const recentTransactions = await prisma.paymentTransaction.findMany({
    where: { course: { teacherId }, status: 'completed' },
    include: {
      student: { select: { fullName: true, avatarUrl: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Top kurslar
  const topCourses = courses
    .map(c => ({
      id: c.id,
      title: c.title,
      enrollmentCount: c._count.enrollments,
      rating: c.rating,
      isPublished: c.isPublished,
    }))
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, 5);

  return jsonResponse({
    courses: courses.map(c => ({
      id: c.id,
      title: c.title,
      coverImage: c.coverImage,
      isPublished: c.isPublished,
      priceUzs: c.priceUzs.toString(),
      enrollmentCount: c._count.enrollments,
      rating: c.rating,
      reviewCount: c.reviewCount,
      createdAt: c.createdAt,
    })),
    stats: {
      totalCourses: courses.length,
      publishedCourses: courses.filter(c => c.isPublished).length,
      pendingCourses: courses.filter(c => !c.isPublished).length,
      totalEnrollments,
      totalRevenueUzs: totalRevenueUzs.toString(),
    },
    monthlyRevenue,
    recentTransactions: recentTransactions.map(t => ({
      id: t.id,
      studentName: t.student.fullName,
      courseTitle: t.course.title,
      amountUzs: t.amountUzs.toString(),
      createdAt: t.createdAt,
    })),
    topCourses,
  });
}
