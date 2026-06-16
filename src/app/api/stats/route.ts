/**
 * GET /api/stats
 *
 * Landing page uchun platforma statistikasi (public, auth talab qilinmaydi).
 * Bitta raw query — 4 ta alohida count o'rniga.
 * 60 sekund cache (ISR) — har so'rovda DB ga bormasligi uchun.
 */

import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';
import { NextResponse } from 'next/server';

export async function GET() {
  const [totalCourses, activeStudents, successfulTeachers, certificatesAwarded] =
    await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.userProfile.count({ where: { role: 'student' } }),
      prisma.userProfile.count({ where: { role: 'teacher' } }),
      prisma.certificate.count(),
    ]);

  const res = jsonResponse({
    totalCourses,
    activeStudents,
    successfulTeachers,
    certificatesAwarded,
  });

  // 60 sekund cache — Vercel CDN edge'da saqlanadi
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  return res;
}
