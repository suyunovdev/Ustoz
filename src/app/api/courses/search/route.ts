/**
 * GET /api/courses/search?q=python&limit=5
 *
 * Tezkor kurs qidirish (autocomplete uchun).
 * Public endpoint — auth kerak emas.
 */

import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';
import type { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  const limit = Math.min(10, Number(req.nextUrl.searchParams.get('limit') || '5'));

  if (q.length < 2) {
    return jsonResponse({ results: [] });
  }

  const courses = await prisma.course.findMany({
    where: {
      isPublished: true,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      title: true,
      category: true,
      coverImage: true,
      teacher: { select: { fullName: true } },
    },
    take: limit,
    orderBy: { enrollmentCount: 'desc' },
  });

  const res = jsonResponse({
    results: courses.map((c) => ({
      id: c.id,
      title: c.title,
      category: c.category,
      coverImage: c.coverImage,
      teacherName: c.teacher.fullName || 'Ustoz',
    })),
  });
  res.headers.set('Cache-Control', 'public, s-maxage=15, stale-while-revalidate=30');
  return res;
}
