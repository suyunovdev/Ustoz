/**
 * POST /api/payment/mock-complete   { transactionId }
 * FAQAT dev/test uchun — gateway sozlanmagan holatda mock to'lovni yakunlaydi:
 * tranzaksiyani 'completed' qiladi va turiga qarab enrollment yoki obuna yaratadi.
 * PRODUCTION'da 403 — soxta to'lov mumkin emas.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { activateSubscriptionFromPayment } from '@/lib/services/subscription.service';

export async function POST(req: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return jsonResponse({ error: 'Mock to\'lov production\'da mavjud emas' }, { status: 403 });
    }
    const session = await requireAuth(req);
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { throw new ValidationError('JSON xato'); }
    const transactionId = String(body.transactionId || '');
    if (!transactionId) throw new ValidationError('transactionId majburiy');

    const txn = await prisma.paymentTransaction.findUnique({ where: { id: transactionId } });
    if (!txn) return jsonResponse({ error: 'Tranzaksiya topilmadi' }, { status: 404 });
    if (txn.studentId !== session.sub) return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });

    // Atomik status transition — idempotent
    const flip = await prisma.paymentTransaction.updateMany({
      where: { id: transactionId, status: { not: 'completed' } },
      data: { status: 'completed', completedAt: new Date() },
    });

    if (flip.count > 0) {
      if (txn.kind === 'subscription' && txn.planId) {
        await activateSubscriptionFromPayment(txn.studentId, txn.planId, txn.id);
      } else if (txn.courseId) {
        // Kurs enrollment + counter (race-safe)
        await prisma.$transaction(async (tx) => {
          const created = await tx.enrollment.createMany({
            data: [{ studentId: txn.studentId, courseId: txn.courseId!, isActive: true }],
            skipDuplicates: true,
          });
          if (created.count > 0) {
            await tx.course.update({
              where: { id: txn.courseId! },
              data: { enrollmentCount: { increment: 1 } },
            });
          } else {
            await tx.enrollment.updateMany({
              where: { studentId: txn.studentId, courseId: txn.courseId!, isActive: false },
              data: { isActive: true },
            });
          }
        });
      }
    }

    return jsonResponse({ success: true, status: 'completed', kind: txn.kind });
  } catch (err) {
    return errorResponse(err);
  }
}
