/**
 * GET /api/assignments/my
 *
 * Talabaning barcha topshiriqlari va ularning submission holati.
 * Faqat enrolled kurslardagi assignment'lar qaytariladi.
 */

import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  // Talaba enrolled kurslar ID'lari
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.sub, isActive: true },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);

  if (courseIds.length === 0) {
    return jsonResponse({ assignments: [], submissions: [] });
  }

  // Shu kurslardagi barcha assignment'lar
  const assignments = await prisma.assignment.findMany({
    where: { courseId: { in: courseIds } },
    include: {
      course: { select: { title: true, teacher: { select: { fullName: true } } } },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Talabaning barcha submission'lari
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { studentId: session.sub, courseId: { in: courseIds } },
    orderBy: { submittedAt: 'desc' },
  });

  return jsonResponse({
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate.toISOString(),
      maxScore: a.maxScore,
      fileRequirements: a.fileRequirements,
      courseId: a.courseId,
      courseTitle: a.course.title,
      teacherName: a.course.teacher.fullName || 'Ustoz',
      createdAt: a.createdAt.toISOString(),
    })),
    submissions: submissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignmentId,
      submissionText: s.submissionText || '',
      submissionUrl: s.submissionUrl,
      submittedAt: s.submittedAt.toISOString(),
      grade: s.grade,
      feedback: s.feedback,
      gradedAt: s.gradedAt?.toISOString() || null,
    })),
  });
}
