import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { handlePaymentCompleted } from '@/lib/repositories/referral.repository';
import { activateSubscriptionFromPayment } from '@/lib/services/subscription.service';

interface ClickCompleteRequest {
  click_trans_id: number;
  service_id: number;
  click_paydoc_id: number;
  merchant_trans_id: string;
  merchant_prepare_id: number;
  amount: number;
  action: number;
  error: number;
  error_note: string;
  sign_time: string;
  sign_string: string;
}

interface ClickCompleteResponse {
  click_trans_id: number;
  merchant_trans_id: string;
  merchant_confirm_id: number;
  error: number;
  error_note: string;
}

export async function POST(request: NextRequest) {
  let body: ClickCompleteRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        click_trans_id: 0,
        merchant_trans_id: '',
        merchant_confirm_id: 0,
        error: -8,
        error_note: 'Invalid JSON',
      } as ClickCompleteResponse,
      { status: 200 }
    );
  }

  try {
    // Verify signature
    const secretKey = process.env.CLICK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -8,
          error_note: 'Server configuration error',
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Verify signature — Click Shop-API MD5 talab qiladi (secret string ichida).
    // Complete formulasi: md5(click_trans_id + service_id + SECRET + merchant_trans_id
    //                        + merchant_prepare_id + amount + action + sign_time)
    const signString = crypto
      .createHash('md5')
      .update(
        `${body.click_trans_id}${body.service_id}${secretKey}${body.merchant_trans_id}${body.merchant_prepare_id}${body.amount}${body.action}${body.sign_time}`
      )
      .digest('hex');

    const providedSign = String(body.sign_string || '');
    const expectedSignBuf = Buffer.from(signString);
    const providedSignBuf = Buffer.from(providedSign);
    const signValid =
      expectedSignBuf.length === providedSignBuf.length &&
      crypto.timingSafeEqual(expectedSignBuf, providedSignBuf);
    if (!signValid) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -1,
          error_note: 'Invalid signature',
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Get transaction
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { merchantTransId: body.merchant_trans_id },
      select: {
        id: true,
        status: true,
        amountUzs: true,
        studentId: true,
        courseId: true,
        kind: true,
        planId: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -5,
          error_note: 'Transaction not found',
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Check if already completed
    if (transaction.status === 'completed') {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: parseInt(
            transaction.id.replace(/-/g, '').substring(0, 8),
            16
          ),
          error: -4,
          error_note: 'Already paid',
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Check if cancelled
    if (transaction.status === 'cancelled') {
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -9,
          error_note: 'Transaction cancelled',
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // If error from Click, mark as failed
    if (body.error < 0) {
      try {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'failed',
            errorMessage: body.error_note,
          },
        });
      } catch (e) {
        console.error('Click complete failed-mark error:', e);
      }

      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -9,
          error_note: body.error_note,
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Mark as completed va enrollment yaratish — atomik.
    // justCompleted: obunani FAQAT haqiqiy status o'tishida (bir marta)
    // faollashtirish uchun — replay webhook'da qayta uzaytirilmasin (C5).
    let justCompleted = false;
    try {
      await prisma.$transaction(async (tx) => {
        // Atomik status transition — concurrent/replay webhook'da FAQAT bir marta
        // "completed" bo'ladi; ikkinchisi count=0 olib, enrollment/counter'ga tegmaydi.
        const flip = await tx.paymentTransaction.updateMany({
          where: { id: transaction.id, status: { not: 'completed' } },
          data: {
            status: 'completed',
            completedAt: new Date(),
            gatewayTransactionId: body.click_trans_id.toString(),
            gatewayPaymentId: body.click_paydoc_id.toString(),
          },
        });
        if (flip.count === 0) return; // allaqachon completed — idempotent
        justCompleted = true;

        // Obuna to'lovi bo'lsa — enrollment YO'Q (obuna tx'dan tashqarida faollashadi)
        if (transaction.kind === 'subscription' || !transaction.courseId) return;

        const courseId = transaction.courseId;
        // Mavjud enrollment'ni topish — counter inkrementi qarori uchun
        const existing = await tx.enrollment.findUnique({
          where: { studentId_courseId: { studentId: transaction.studentId, courseId } },
          select: { isActive: true },
        });
        const shouldIncrement = !existing || !existing.isActive;
        await tx.enrollment.upsert({
          where: { studentId_courseId: { studentId: transaction.studentId, courseId } },
          create: { studentId: transaction.studentId, courseId, isActive: true },
          update: { isActive: true },
        });
        if (shouldIncrement) {
          await tx.course.update({
            where: { id: courseId },
            data: { enrollmentCount: { increment: 1 } },
          });
        }
      });
    } catch (updateError) {
      console.error('Click complete update error:', updateError);
      return NextResponse.json(
        {
          click_trans_id: body.click_trans_id,
          merchant_trans_id: body.merchant_trans_id,
          merchant_confirm_id: 0,
          error: -8,
          error_note: 'Failed to complete transaction',
        } as ClickCompleteResponse,
        { status: 200 }
      );
    }

    // Obuna to'lovi bo'lsa — obunani faollashtirish (best-effort).
    // FAQAT shu so'rov statusni "completed"ga o'tkazgan bo'lsa (justCompleted) —
    // aks holda replay webhook obunani ikkinchi marta uzaytirib yuborardi.
    if (justCompleted && transaction.kind === 'subscription' && transaction.planId) {
      try {
        await activateSubscriptionFromPayment(transaction.studentId, transaction.planId, transaction.id);
      } catch (e) {
        console.error('Click subscription activation error:', e);
      }
    }

    // Referral komissiya (best-effort — muvaffaqiyatsizlik to'lovni buzmaydi).
    // Faqat haqiqiy completion'da — replay webhook komissiyani takrorlamasin.
    if (justCompleted) {
      try {
        await handlePaymentCompleted(transaction.id);
      } catch (e) {
        console.error('Click referral hook error:', e);
      }
    }

    // Success
    return NextResponse.json(
      {
        click_trans_id: body.click_trans_id,
        merchant_trans_id: body.merchant_trans_id,
        merchant_confirm_id: parseInt(
          transaction.id.replace(/-/g, '').substring(0, 8),
          16
        ),
        error: 0,
        error_note: 'Success',
      } as ClickCompleteResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Click complete error:', error);
    return NextResponse.json(
      {
        click_trans_id: body?.click_trans_id ?? 0,
        merchant_trans_id: body?.merchant_trans_id ?? '',
        merchant_confirm_id: 0,
        error: -8,
        error_note: 'Internal server error',
      } as ClickCompleteResponse,
      { status: 200 }
    );
  }
}
