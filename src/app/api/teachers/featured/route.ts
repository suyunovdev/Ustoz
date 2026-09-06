/**
 * GET /api/teachers/featured — bosh sahifadagi "tanlangan o'qituvchilar" bloki uchun
 * HAQIQIY ma'lumot (soxta ismlar emas). Nashr etilgan kursi bor o'qituvchilar, eng ko'p
 * o'quvchiga ega bo'lganlar bo'yicha saralanadi. Ma'lumot bo'lmasa — bo'sh massiv
 * (front-end blokni yashiradi).
 */
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

export async function GET(req: NextRequest) {
  const limit = Math.min(Number(new URL(req.url).searchParams.get('limit')) || 4, 12);

  // Nashr etilgan kurslar bo'yicha o'qituvchi statistikasi
  const grouped = await prisma.course.groupBy({
    by: ['teacherId'],
    where: { isPublished: true, suspendedAt: null },
    _count: { _all: true },
    _sum: { enrollmentCount: true },
    orderBy: { _sum: { enrollmentCount: 'desc' } },
    take: limit,
  });
  if (grouped.length === 0) return jsonResponse({ teachers: [] });

  const ids = grouped.map((g) => g.teacherId);
  const profiles = await prisma.userProfile.findMany({
    where: { id: { in: ids }, role: 'teacher', deletedAt: null, isActive: true },
    select: { id: true, fullName: true, avatarUrl: true },
  });
  const byId = new Map(profiles.map((p) => [p.id, p]));

  const teachers = grouped
    .map((g) => {
      const p = byId.get(g.teacherId);
      if (!p) return null;
      return {
        id: p.id,
        fullName: p.fullName,
        avatarUrl: p.avatarUrl,
        courseCount: g._count._all,
        studentCount: g._sum.enrollmentCount ?? 0,
      };
    })
    .filter(Boolean);

  return jsonResponse({ teachers });
}
