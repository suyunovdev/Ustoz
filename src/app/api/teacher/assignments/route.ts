// @ts-nocheck
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/teacher/assignments — teacher topshiriqlari
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const assignments = await prisma.assignment.findMany({
    where: { teacherId: session.sub },
    include: {
      course: { select: { title: true } },
      submissions: { select: { id: true, grade: true } },
    },
    orderBy: { dueDate: 'desc' },
  });

  return jsonResponse({
    assignments: assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      maxScore: a.maxScore,
      fileRequirements: a.fileRequirements,
      courseId: a.courseId,
      courseTitle: a.course?.title || '',
      submissionCount: a.submissions.length,
      gradedCount: a.submissions.filter((s) => s.grade !== null).length,
      createdAt: a.createdAt,
    })),
  });
}

// POST /api/teacher/assignments — yangi topshiriq yaratish
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const { courseId, title, description, dueDate, maxScore = 100, fileRequirements } = await req.json();

  if (!courseId || !title || !dueDate) {
    return jsonResponse({ error: 'courseId, title va dueDate majburiy' }, { status: 400 });
  }

  // Owner tekshirish
  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId: session.sub },
  });
  if (!course) return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });

  const assignment = await prisma.assignment.create({
    data: {
      courseId,
      teacherId: session.sub,
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      maxScore: Number(maxScore),
      fileRequirements: fileRequirements || null,
    },
  });

  return jsonResponse({ assignment }, { status: 201 });
}
