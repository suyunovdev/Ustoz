/**
 * POST /api/payment/initiate
 * To'lovni boshlash — Click yoki Payme orqali.
 * Hozirda gateway sozlanmagan bo'lsa mock URL qaytaradi.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import type { PaymentMethod } from '@/generated/prisma/client';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? 'http://localhost:4028';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }

    const { courseId, paymentMethod, amount } = body;

    if (typeof courseId !== 'string') throw new ValidationError('courseId majburiy');
    if (paymentMethod !== 'click' && paymentMethod !== 'payme') {
      throw new ValidationError('paymentMethod: click yoki payme bo\'lishi kerak');
    }

    // Kursni tekshirish
    const course = await prisma.course.findFirst({
      where: { id: courseId, isPublished: true },
      select: { id: true, title: true, priceUzs: true },
    });
    if (!course) return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });

    const priceUzs = Number(course.priceUzs);
    if (priceUzs <= 0) {
      return jsonResponse({ error: 'Bu kurs bepul — /api/courses/[id]/enroll ishlatiladi' }, { status: 400 });
    }

    // Allaqachon aktif enrollment bormi?
    const existing = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: session.sub, courseId } },
      select: { isActive: true },
    });
    if (existing?.isActive) {
      return jsonResponse({ error: 'Siz allaqachon bu kursga yozilgansiz' }, { status: 409 });
    }

    // Merchantga unique ID
    const merchantTransId = `${session.sub.slice(0, 8)}-${courseId.slice(0, 8)}-${Date.now()}`;

    // Transaction yaratish
    const transaction = await prisma.paymentTransaction.create({
      data: {
        studentId: session.sub,
        courseId,
        amountUzs: BigInt(priceUzs),
        currency: 'UZS',
        paymentMethod: paymentMethod as PaymentMethod,
        status: 'pending',
        merchantTransId,
      },
    });

    // Payment URL yaratish
    let paymentUrl = '';
    const clickMerchantId = process.env.CLICK_MERCHANT_ID;
    const clickServiceId = process.env.CLICK_SERVICE_ID;
    const paymeKey = process.env.PAYME_MERCHANT_ID;

    if (paymentMethod === 'click' && clickMerchantId && clickServiceId) {
      const returnUrl = encodeURIComponent(`${SITE_URL}/payment-success-confirmation?transaction_id=${transaction.id}`);
      paymentUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${priceUzs / 100}&transaction_param=${merchantTransId}&return_url=${returnUrl}`;
    } else if (paymentMethod === 'payme' && paymeKey) {
      // Payme checkout URL (amount in tiyins)
      const params = Buffer.from(JSON.stringify({ m: paymeKey, ac: { order_id: transaction.id }, a: priceUzs * 100, l: 'uz' })).toString('base64');
      paymentUrl = `https://checkout.paycom.uz/${params}`;
    } else {
      // Gateway sozlanmagan — mock URL (test/dev uchun)
      paymentUrl = `${SITE_URL}/payment-success-confirmation?transaction_id=${transaction.id}&mock=1`;
    }

    return jsonResponse({
      transactionId: transaction.id,
      paymentUrl,
      amount: priceUzs,
      currency: 'UZS',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
