import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PaymeRequest {
  method: string;
  params: {
    id?: string;
    account?: {
      order_id?: string;
    };
    amount?: number;
    time?: number;
    reason?: number;
  };
  id: number;
}

interface PaymeResponse {
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: string;
  };
  id: number;
}

function createPaymeError(
  code: number,
  message: string,
  id: number,
  data?: string
): NextResponse {
  return NextResponse.json({
    error: {
      code,
      message,
      data,
    },
    id,
  } as PaymeResponse);
}

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return createPaymeError(-32504, 'Insufficient privilege to perform this method', 0);
    }

    const paymeKey = process.env.PAYME_KEY;
    const paymeMerchantId = process.env.PAYME_MERCHANT_ID;

    if (!paymeKey || !paymeMerchantId) {
      return createPaymeError(-32400, 'Server configuration error', 0);
    }

    // Verify Basic Auth
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    const expectedAuth = `Payme:${paymeKey}`;
    const providedAuth = `${username}:${password}`;

    if (providedAuth !== expectedAuth) {
      return createPaymeError(-32504, 'Insufficient privilege to perform this method', 0);
    }

    const body: PaymeRequest = await request.json();

    switch (body.method) {
      case 'CheckPerformTransaction': {
        const orderId = body.params.account?.order_id;
        const amount = body.params.amount;

        if (!orderId) {
          return createPaymeError(-31050, 'Order not found', body.id);
        }

        const transaction = await prisma.paymentTransaction.findUnique({
          where: { merchantTransId: orderId },
          select: {
            id: true,
            status: true,
            amountUzs: true,
            studentId: true,
            courseId: true,
          },
        });

        if (!transaction) {
          return createPaymeError(-31050, 'Order not found', body.id);
        }

        if (transaction.status === 'completed') {
          return createPaymeError(-31051, 'Order already paid', body.id);
        }

        if (transaction.status === 'cancelled') {
          return createPaymeError(-31099, 'Order cancelled', body.id);
        }

        // Payme sends amount in tiyin, DB stores in som
        const expectedAmount = Number(transaction.amountUzs) * 100;
        if (amount !== expectedAmount) {
          return createPaymeError(-31001, 'Incorrect amount', body.id);
        }

        return NextResponse.json({
          result: { allow: true },
          id: body.id,
        } as PaymeResponse);
      }

      case 'CreateTransaction': {
        const orderId = body.params.account?.order_id;
        const transactionId = body.params.id;
        const time = body.params.time;

        if (!orderId || !transactionId) {
          return createPaymeError(-31050, 'Order not found', body.id);
        }

        const transaction = await prisma.paymentTransaction.findUnique({
          where: { merchantTransId: orderId },
          select: {
            id: true,
            status: true,
            amountUzs: true,
            paymeTransactionId: true,
          },
        });

        if (!transaction) {
          return createPaymeError(-31050, 'Order not found', body.id);
        }

        // Existing payme tx with different ID -> conflict
        if (
          transaction.paymeTransactionId &&
          transaction.paymeTransactionId !== transactionId
        ) {
          return createPaymeError(-31099, 'Transaction already exists', body.id);
        }

        // Already processing with same id -> return existing
        if (transaction.paymeTransactionId === transactionId) {
          return NextResponse.json({
            result: {
              create_time: time,
              transaction: transaction.id,
              state: transaction.status === 'completed' ? 2 : 1,
            },
            id: body.id,
          } as PaymeResponse);
        }

        try {
          await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'processing',
              paymeTransactionId: transactionId,
              paymeTime: time ? BigInt(time) : null,
            },
          });
        } catch (updateError) {
          console.error('Payme CreateTransaction update error:', updateError);
          return createPaymeError(-31008, 'Failed to create transaction', body.id);
        }

        return NextResponse.json({
          result: {
            create_time: time,
            transaction: transaction.id,
            state: 1,
          },
          id: body.id,
        } as PaymeResponse);
      }

      case 'PerformTransaction': {
        const transactionId = body.params.id;

        if (!transactionId) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        const transaction = await prisma.paymentTransaction.findFirst({
          where: { paymeTransactionId: transactionId },
          select: {
            id: true,
            status: true,
            paymeTime: true,
            completedAt: true,
            studentId: true,
            courseId: true,
          },
        });

        if (!transaction) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        if (transaction.status === 'completed') {
          return NextResponse.json({
            result: {
              transaction: transaction.id,
              perform_time: transaction.completedAt
                ? transaction.completedAt.getTime()
                : Date.now(),
              state: 2,
            },
            id: body.id,
          } as PaymeResponse);
        }

        const performTime = Date.now();
        try {
          // Tranzaksiyani completed qilish + enrollment yaratish — atomik
          await prisma.$transaction(async (tx) => {
            await tx.paymentTransaction.update({
              where: { id: transaction.id },
              data: {
                status: 'completed',
                completedAt: new Date(performTime),
              },
            });

            const existing = await tx.enrollment.findUnique({
              where: {
                studentId_courseId: {
                  studentId: transaction.studentId,
                  courseId: transaction.courseId,
                },
              },
              select: { isActive: true },
            });

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
          console.error('Payme PerformTransaction update error:', updateError);
          return createPaymeError(-31008, 'Failed to perform transaction', body.id);
        }

        return NextResponse.json({
          result: {
            transaction: transaction.id,
            perform_time: performTime,
            state: 2,
          },
          id: body.id,
        } as PaymeResponse);
      }

      case 'CancelTransaction': {
        const transactionId = body.params.id;
        const reason = body.params.reason;

        if (!transactionId) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        const transaction = await prisma.paymentTransaction.findFirst({
          where: { paymeTransactionId: transactionId },
          select: { id: true, status: true, cancelledAt: true },
        });

        if (!transaction) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        if (transaction.status === 'cancelled') {
          return NextResponse.json({
            result: {
              transaction: transaction.id,
              cancel_time: transaction.cancelledAt
                ? transaction.cancelledAt.getTime()
                : Date.now(),
              state: -1,
            },
            id: body.id,
          } as PaymeResponse);
        }

        const cancelTime = Date.now();
        try {
          await prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'cancelled',
              cancelledAt: new Date(cancelTime),
              errorMessage: `Cancelled by Payme. Reason: ${reason}`,
            },
          });
        } catch (updateError) {
          console.error('Payme CancelTransaction update error:', updateError);
          return createPaymeError(-31008, 'Failed to cancel transaction', body.id);
        }

        return NextResponse.json({
          result: {
            transaction: transaction.id,
            cancel_time: cancelTime,
            state: -1,
          },
          id: body.id,
        } as PaymeResponse);
      }

      case 'CheckTransaction': {
        const transactionId = body.params.id;

        if (!transactionId) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        const transaction = await prisma.paymentTransaction.findFirst({
          where: { paymeTransactionId: transactionId },
          select: {
            id: true,
            status: true,
            paymeTime: true,
            completedAt: true,
            cancelledAt: true,
          },
        });

        if (!transaction) {
          return createPaymeError(-31003, 'Transaction not found', body.id);
        }

        let state = 1; // processing
        if (transaction.status === 'completed') state = 2;
        if (transaction.status === 'cancelled') state = -1;

        return NextResponse.json({
          result: {
            create_time: transaction.paymeTime ? Number(transaction.paymeTime) : Date.now(),
            perform_time: transaction.completedAt
              ? transaction.completedAt.getTime()
              : 0,
            cancel_time: transaction.cancelledAt
              ? transaction.cancelledAt.getTime()
              : 0,
            transaction: transaction.id,
            state,
            reason: null,
          },
          id: body.id,
        } as PaymeResponse);
      }

      default:
        return createPaymeError(-32601, 'Method not found', body.id);
    }
  } catch (error) {
    console.error('Payme webhook error:', error);
    return createPaymeError(-32400, 'Internal server error', 0);
  }
}
