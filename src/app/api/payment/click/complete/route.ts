import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

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

    // Verify signature — HMAC-SHA256 (MD5 emas, xavfsizroq)
    const signString = crypto
      .createHmac('sha256', secretKey)
      .update(
        `${body.click_trans_id}${body.service_id}${secretKey}${body.merchant_trans_id}${body.merchant_prepare_id}${body.amount}${body.action}${body.sign_time}`
      )
      .digest('hex');

    if (signString !== body.sign_string) {
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

    // Mark as completed va enrollment yaratish — atomik
    try {
      await prisma.$transaction(async (tx) => {
        await tx.paymentTransaction.update({
          where: { id: transaction.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            gatewayTransactionId: body.click_trans_id.toString(),
            gatewayPaymentId: body.click_paydoc_id.toString(),
          },
        });

        // Mavjud enrollment'ni topish — counter inkrementi qarori uchun
        const existing = await tx.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: transaction.studentId,
              courseId: transaction.courseId,
            },
          },
          select: { isActive: true },
        });

        // Faqat yangi yoki noaktiv enrollment bo'lsa counter oshiriladi
        const shouldIncrement = !existing || !existing.isActive;

        await tx.enrollment.upsert({
          where: {
            studentId_courseId: {
              studentId: transaction.studentId,
              courseId: transaction.courseId,
            },
          },
          create: {
            studentId: transaction.studentId,
            courseId: transaction.courseId,
            isActive: true,
          },
          update: {
            isActive: true,
          },
        });

        if (shouldIncrement) {
          await tx.course.update({
            where: { id: transaction.courseId },
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
