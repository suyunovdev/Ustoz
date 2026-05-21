import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/teacher/students — Teacher kurslariga yozilgan barcha studentlar
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return NextResponse.json({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { course: { teacherId: session.sub } },
    include: {
      student: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      course: { select: { id: true, title: true } },
    },
    distinct: ['studentId'],
  });

  // Unique studentlar
  const studentMap = new Map();
  for (const e of enrollments) {
    if (!studentMap.has(e.studentId)) {
      studentMap.set(e.studentId, {
        id: e.student.id,
        fullName: e.student.fullName,
        email: e.student.email,
        avatarUrl: e.student.avatarUrl,
        enrolledCourses: [],
      });
    }
    studentMap.get(e.studentId).enrolledCourses.push({
      id: e.course.id,
      title: e.course.title,
      progress: e.progress,
    });
  }

  return NextResponse.json({ students: Array.from(studentMap.values()) });
}
