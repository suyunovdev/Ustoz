/**
 * GET /api/stats
 *
 * Landing page uchun platforma statistikasi (public, auth talab qilinmaydi).
 */

import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

export async function GET() {
  const [totalCourses, activeStudents, successfulTeachers, certificatesAwarded] =
    await Promise.all([
      prisma.course.count({ where: { isPublished: true } }),
      prisma.userProfile.count({ where: { role: 'student' } }),
      prisma.userProfile.count({ where: { role: 'teacher' } }),
      prisma.certificate.count(),
    ]);

  return jsonResponse({
    totalCourses,
    activeStudents,
    successfulTeachers,
    certificatesAwarded,
  });
}
