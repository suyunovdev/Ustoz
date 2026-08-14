/**
 * POST /api/assignments/[id]/submit
 * Topshiriq topshirish.
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { assignmentRepo } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { serializeData } from '@/lib/json';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireStudent(req);
    const { id: assignmentId } = await params;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }

    const assignment = await assignmentRepo.findAssignmentWithCourse(assignmentId);
    if (!assignment) {
      return jsonResponse({ error: 'Topshiriq topilmadi' }, { status: 404 });
    }
    if (assignment.status !== 'published') {
      return jsonResponse({ error: 'Bu topshiriq hali faol emas' }, { status: 400 });
    }

    // Ownership/enrollment: faqat kursga yozilgan talaba topshira oladi
    // (GET yo'lidagi tekshiruv bilan izchil — IDOR/data-pollution oldini oladi).
    const enrolled = await prisma.enrollment.findFirst({
      where: { courseId: assignment.courseId, studentId: session.sub },
      select: { id: true },
    });
    if (!enrolled) {
      return jsonResponse(
        { error: 'Kursga yozilmagansiz', code: 'NOT_ENROLLED' },
        { status: 403 },
      );
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;
    // Muddat o'tgan va kech topshirishga ruxsat yo'q → rad etamiz
    if (isLate && !assignment.allowLateSubmission) {
      return jsonResponse(
        { error: 'Topshirish muddati tugagan', code: 'DEADLINE_PASSED' },
        { status: 400 },
      );
    }

    const submission = await assignmentRepo.upsertSubmission({
      assignmentId,
      studentId: session.sub,
      courseId: assignment.courseId,
      submissionText: typeof body.submissionText === 'string' ? body.submissionText : null,
      submissionUrl: typeof body.submissionUrl === 'string' ? body.submissionUrl : null,
      attachments: Array.isArray(body.attachments) ? body.attachments as never[] : [],
      isLate,
    });

    return jsonResponse({ submission: serializeData(submission) }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
