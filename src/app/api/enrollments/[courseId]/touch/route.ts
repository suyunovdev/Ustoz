/**
 * POST /api/enrollments/[courseId]/touch
 * Kursga oxirgi kirish vaqtini yangilash (hero card uchun).
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> },
) {
  try {
    const session = await requireStudent(req);
    const { courseId } = await params;

    await prisma.enrollment.updateMany({
      where: { studentId: session.sub, courseId, isActive: true },
      data: { lastAccessedAt: new Date() },
    });

    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
