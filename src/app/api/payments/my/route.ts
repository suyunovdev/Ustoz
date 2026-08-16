/**
 * GET /api/payments/my
 * Talabaning to'lov tarixi.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    const transactions = await prisma.paymentTransaction.findMany({
      where: { studentId: session.sub },
      include: {
        course: { select: { title: true, teacherId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return jsonResponse({
      transactions: transactions.map((t) => ({
        id: t.id,
        course_id: t.courseId,
        amount_uzs: t.amountUzs.toString(),
        payment_method: t.paymentMethod,
        status: t.status,
        merchant_trans_id: t.merchantTransId ?? '',
        created_at: t.createdAt.toISOString(),
        completed_at: t.completedAt ? t.completedAt.toISOString() : null,
        kind: t.kind,
        courses: t.course
          ? { title: t.course.title, teacher_id: t.course.teacherId }
          : null,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
