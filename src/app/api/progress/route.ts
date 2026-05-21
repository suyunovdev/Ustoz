import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/progress?courseId=xxx
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const courseId = req.nextUrl.searchParams.get('courseId');
  if (!courseId) return NextResponse.json({ error: 'courseId talab qilinadi' }, { status: 400 });

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: session.sub, courseId },
  });

  if (!enrollment) return NextResponse.json({ error: 'Kurs topilmadi' }, { status: 404 });

  return NextResponse.json({
    progress: enrollment.progress,
    enrolledAt: enrollment.enrolledAt,
    completedAt: enrollment.completedAt,
    isActive: enrollment.isActive,
  });
}

// PATCH /api/progress
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });

  const { courseId, progress } = await req.json();
  if (!courseId || progress === undefined) {
    return NextResponse.json({ error: 'courseId va progress talab qilinadi' }, { status: 400 });
  }

  const progressNum = Math.min(100, Math.max(0, Number(progress)));
  const enrollment = await prisma.enrollment.findFirst({ where: { studentId: session.sub, courseId } });
  if (!enrollment) return NextResponse.json({ error: 'Enrollment topilmadi' }, { status: 404 });

  if (progressNum <= enrollment.progress) {
    return NextResponse.json({ progress: enrollment.progress });
  }

  const updated = await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: {
      progress: progressNum,
      completedAt: progressNum === 100 ? new Date() : enrollment.completedAt,
    },
  });

  return NextResponse.json({ progress: updated.progress, completedAt: updated.completedAt });
}
