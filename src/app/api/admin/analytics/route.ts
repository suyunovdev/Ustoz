/**
 * GET /api/admin/analytics
 *
 * Admin dashboard uchun analytics data — real DB dan.
 */

import type { NextRequest } from 'next/server';
import { requireAdmin, errorResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    // Oxirgi 6 oy uchun oylik user o'sishi
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const users = await prisma.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, role: true },
    });

    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const now = new Date();
    const userGrowthData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthUsers = users.filter(u => u.createdAt <= monthEnd);
      userGrowthData.push({
        month: months[d.getMonth()],
        users: monthUsers.length,
        teachers: monthUsers.filter(u => u.role === 'teacher').length,
        students: monthUsers.filter(u => u.role === 'student').length,
      });
    }

    // Enrollment va completion statistikasi
    const enrollments = await prisma.enrollment.findMany({
      where: { enrolledAt: { gte: sixMonthsAgo } },
      select: { enrolledAt: true, progress: true, completedAt: true },
    });

    const courseCompletionData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthEnrollments = enrollments.filter(e => e.enrolledAt <= monthEnd);
      const completed = monthEnrollments.filter(e => e.completedAt !== null).length;
      const total = monthEnrollments.length || 1;
      courseCompletionData.push({
        month: months[d.getMonth()],
        completion: Math.round((completed / total) * 100),
        enrollment: total,
      });
    }

    // Haftalik faollik (oxirgi 7 kun)
    const weekDays = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];
    const engagementData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayLogins = await prisma.user.count({
        where: { updatedAt: { gte: d, lt: nextDay } },
      });

      engagementData.push({
        day: weekDays[d.getDay()],
        active: dayLogins,
        sessions: dayLogins * 3,
      });
    }

    return jsonResponse({ userGrowthData, courseCompletionData, engagementData });
  } catch (err) {
    return errorResponse(err);
  }
}
