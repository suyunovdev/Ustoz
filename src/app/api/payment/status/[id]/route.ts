/**
 * GET /api/payment/status/[id]
 * To'lov holati (polling uchun).
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const tx = await prisma.paymentTransaction.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        courseId: true,
        amountUzs: true,
        paymentMethod: true,
        status: true,
        merchantTransId: true,
        errorMessage: true,
        createdAt: true,
        completedAt: true,
      },
    });

    if (!tx) {
      return jsonResponse({ error: 'Transaction topilmadi' }, { status: 404 });
    }

    // Faqat o'zining transactionini ko'ra oladi
    if (tx.studentId !== session.sub && session.role !== 'admin') {
      return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }

    return jsonResponse({
      transaction: {
        id: tx.id,
        course_id: tx.courseId,
        amount_uzs: tx.amountUzs.toString(),
        payment_method: tx.paymentMethod,
        status: tx.status,
        merchant_trans_id: tx.merchantTransId ?? '',
        error_message: tx.errorMessage ?? undefined,
        created_at: tx.createdAt.toISOString(),
        completed_at: tx.completedAt ? tx.completedAt.toISOString() : undefined,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
