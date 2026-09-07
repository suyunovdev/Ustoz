/**
 * GET /api/profile/overview
 * Profil sarlavhasidagi statistika — rolga qarab:
 *   student → yozilgan/tugatilgan kurs, sertifikat, streak
 *   teacher → kurslar, o'quvchilar, o'rtacha reyting, jami daromad
 *   admin   → (minimal)
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { enrollmentRepo, certificateRepo } from '@/lib/repositories';
import { getCurrentStreak } from '@/lib/services/streak.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const role = session.role;

    if (role === 'student') {
      const [counts, certificates, streak] = await Promise.all([
        enrollmentRepo.countByStudent(session.sub),
        certificateRepo.countByStudent(session.sub),
        getCurrentStreak(session.sub),
      ]);
      return jsonResponse({
        role,
        stats: {
          enrolled: counts.enrolled,
          completed: counts.completed,
          certificates,
          streak,
        },
      });
    }

    if (role === 'teacher') {
      const [courses, agg, revenue] = await Promise.all([
        prisma.course.count({ where: { teacherId: session.sub, isPublished: true } }),
        prisma.course.aggregate({
          where: { teacherId: session.sub, isPublished: true },
          _sum: { enrollmentCount: true },
          _avg: { rating: true },
        }),
        prisma.paymentTransaction.aggregate({
          where: { status: 'completed', course: { teacherId: session.sub } },
          _sum: { amountUzs: true },
        }),
      ]);
      return jsonResponse({
        role,
        stats: {
          courses,
          students: agg._sum.enrollmentCount ?? 0,
          avgRating: Number(agg._avg.rating ?? 0),
          revenueUzs: (revenue._sum.amountUzs ?? BigInt(0)).toString(),
        },
      });
    }

    // admin — hozircha minimal
    return jsonResponse({ role, stats: {} });
  } catch (err) {
    return errorResponse(err);
  }
}
