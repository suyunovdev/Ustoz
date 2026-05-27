// @ts-nocheck
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

// PATCH /api/teacher/assignments/[id]/submissions/[subId] — baholash
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  if (session.role !== 'teacher' && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  const { id, subId } = await params;
  const { grade, feedback } = await req.json();

  // Owner tekshirish
  const assignment = await prisma.assignment.findFirst({
    where: { id, teacherId: session.sub },
  });
  if (!assignment) return jsonResponse({ error: 'Topshiriq topilmadi' }, { status: 404 });

  if (grade !== undefined && (grade < 0 || grade > assignment.maxScore)) {
    return jsonResponse(
      { error: `Ball 0 va ${assignment.maxScore} oralig'ida bo'lishi kerak` },
      { status: 400 }
    );
  }

  const updated = await prisma.assignmentSubmission.update({
    where: { id: subId },
    data: {
      ...(grade !== undefined && { grade: Number(grade) }),
      ...(feedback !== undefined && { feedback }),
      gradedAt: new Date(),
      gradedBy: session.sub,
    },
  });

  return jsonResponse({ submission: updated });
}
