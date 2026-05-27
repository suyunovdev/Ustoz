// @ts-nocheck
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// GET /api/teacher/assignments/[id]/submissions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const { id } = await params;

  // Owner tekshirish
  const assignment = await prisma.assignment.findFirst({
    where: { id, teacherId: session.sub },
  });
  if (!assignment) return jsonResponse({ error: 'Topshiriq topilmadi' }, { status: 404 });

  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: id },
    include: {
      student: { select: { fullName: true, email: true } },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return jsonResponse({
    submissions: submissions.map((s) => ({
      id: s.id,
      studentName: s.student?.fullName || 'Noma\'lum',
      studentEmail: s.student?.email || '',
      submittedAt: s.submittedAt,
      submissionText: s.submissionText || '',
      submissionUrl: s.submissionUrl,
      grade: s.grade,
      feedback: s.feedback,
      gradedAt: s.gradedAt,
    })),
  });
}
