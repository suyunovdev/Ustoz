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

    const { searchParams } = new URL(req.url);
    const limitRaw = Number(searchParams.get('limit'));
    const limit = Number.isFinite(limitRaw) && limitRaw >= 1 ? Math.min(50, Math.floor(limitRaw)) : 20;
    const cursor = searchParams.get('cursor') || undefined;

    // Cursor pagination: limit+1 o'qib, oxirgisini keyingi sahifa kaliti sifatida
    // ajratamiz (ilgari qattiq take:100 edi — og'ir tarixlar jimgina kesilardi).
    const rows = await prisma.paymentTransaction.findMany({
      where: { studentId: session.sub },
      include: {
        course: { select: { title: true, teacherId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const transactions = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? transactions[transactions.length - 1].id : null;

    return jsonResponse({
      nextCursor,
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
