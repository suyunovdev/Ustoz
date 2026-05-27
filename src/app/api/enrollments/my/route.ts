// @ts-nocheck
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/enrollments/my — Student dashboard payload:
// { enrollments, recommended, stats, certificates }
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  // 1) Enrollments + course details
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.sub, isActive: true },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
        include: {
          teacher: { select: { fullName: true, avatarUrl: true } },
          _count: { select: { topics: true } },
        },
      },
    },
  });

  const enrolledIds = enrollments.map((e) => e.courseId);
  const completedCount = enrollments.filter((e) => e.progress >= 100).length;

  // 2) Recommended: published courses NOT enrolled, top-rated, max 6
  const recommended = await prisma.course.findMany({
    where: {
      isPublished: true,
      ...(enrolledIds.length > 0 ? { id: { notIn: enrolledIds } } : {}),
    },
    orderBy: [{ rating: 'desc' }, { enrollmentCount: 'desc' }],
    take: 6,
    include: {
      teacher: { select: { fullName: true, avatarUrl: true } },
      _count: { select: { enrollments: true } },
    },
  });

  // 3) Certificates (real ones)
  const certificates = await prisma.certificate.findMany({
    where: { studentId: session.sub },
    orderBy: { issuedAt: 'desc' },
    include: { course: { select: { title: true } } },
  });

  return jsonResponse({
    enrollments: enrollments.map((e) => ({
      id: e.id,
      courseId: e.courseId,
      progress: e.progress,
      enrolledAt: e.enrolledAt,
      completedAt: e.completedAt,
      isCompleted: e.progress >= 100,
      course: {
        id: e.course.id,
        title: e.course.title,
        coverImage: e.course.coverImage,
        totalTopics: e.course._count.topics,
        totalDuration: e.course.totalDuration,
        teacherName: e.course.teacher.fullName,
        teacherAvatar: e.course.teacher.avatarUrl,
      },
    })),
    recommended: recommended.map((c) => ({
      id: c.id,
      title: c.title,
      coverImage: c.coverImage,
      category: c.category,
      priceUzs: c.priceUzs.toString(),
      priceUsd: c.priceUsd.toString(),
      rating: Number(c.rating) || 0,
      reviewCount: c.reviewCount,
      enrollmentCount: c._count.enrollments,
      language: c.language,
      difficultyLevel: c.difficultyLevel,
      teacherName: c.teacher.fullName,
      teacherAvatar: c.teacher.avatarUrl,
    })),
    certificates: certificates.map((cert) => ({
      id: cert.id,
      courseId: cert.courseId,
      courseTitle: cert.course.title,
      certificateNumber: cert.certificateNumber,
      issuedAt: cert.issuedAt,
      verificationUrl: cert.verificationUrl,
    })),
    stats: {
      enrolledCount: enrollments.length,
      coursesCompleted: completedCount,
      certificatesEarned: certificates.length,
    },
  });
}
