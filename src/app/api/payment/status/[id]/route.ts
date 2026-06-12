/**
 * GET /api/payment/status/[id]
 *
 * To'lov holati polling endpointi.
 * PaymentProcessingInteractive har 3 sekundda shu endpoint'ni so'raydi.
 */

import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse({ error: 'Autentifikatsiya talab qilinadi' }, { status: 401 });
  }

  const { id } = await params;

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id },
    include: {
      course: { select: { id: true, title: true } },
    },
  });

  if (!transaction) {
    return jsonResponse({ error: 'Tranzaksiya topilmadi' }, { status: 404 });
  }

  // Faqat o'z tranzaksiyasini ko'rishi mumkin
  if (transaction.studentId !== session.sub && session.role !== 'admin') {
    return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
  }

  return jsonResponse({
    transaction: {
      id: transaction.id,
      course_id: transaction.courseId,
      payment_method: transaction.paymentMethod,
      amount_uzs: transaction.amountUzs.toString(),
      status: transaction.status,
      error_message: transaction.errorMessage,
      created_at: transaction.createdAt.toISOString(),
      completed_at: transaction.completedAt?.toISOString() || null,
    },
    course: {
      id: transaction.course.id,
      title: transaction.course.title,
    },
  });
}
