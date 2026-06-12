/**
 * GET /api/payments/my
 *
 * Joriy foydalanuvchining to'lov tarixi.
 * Query: ?page=1&limit=20
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

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') || '20')));
  const skip = (page - 1) * limit;

  const where = { studentId: session.sub };

  const [transactions, total] = await Promise.all([
    prisma.paymentTransaction.findMany({
      where,
      include: {
        course: { select: { title: true, teacherId: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.paymentTransaction.count({ where }),
  ]);

  return jsonResponse({
    transactions: transactions.map((t) => ({
      id: t.id,
      course_id: t.courseId,
      amount_uzs: t.amountUzs.toString(),
      payment_method: t.paymentMethod,
      status: t.status,
      merchant_trans_id: t.merchantTransId || '',
      created_at: t.createdAt.toISOString(),
      completed_at: t.completedAt?.toISOString() || null,
      courses: {
        title: t.course.title,
        teacher_id: t.course.teacherId,
      },
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}
