/**
 * POST /api/payment/initiate
 * To'lovni boshlash — Click yoki Payme orqali.
 * Body: { paymentMethod: 'click'|'payme', courseId? , planId? }
 *   - courseId → kurs sotib olish
 *   - planId   → obuna (subscription)
 * Gateway sozlanmagan bo'lsa: dev'da mock URL; PRODUCTION'da 503 (soxta success YO'Q).
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { isUuid } from '@/lib/validation';
import { getSubscriberDiscountPct, applyDiscount } from '@/lib/services/subscription.service';
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

    const { courseId, planId, paymentMethod } = body;
    if (paymentMethod !== 'click' && paymentMethod !== 'payme') {
      throw new ValidationError('paymentMethod: click yoki payme bo\'lishi kerak');
    }
    // courseId/planId — mavjud bo'lsa, to'g'ri UUID formatida bo'lishi shart
    // (noto'g'ri format → 400, "topilmadi" 404 emas).
    if (courseId !== undefined && !isUuid(courseId)) {
      throw new ValidationError('courseId noto\'g\'ri formatda');
    }
    if (planId !== undefined && !isUuid(planId)) {
      throw new ValidationError('planId noto\'g\'ri formatda');
    }
    if (courseId === undefined && planId === undefined) {
      throw new ValidationError('courseId yoki planId majburiy');
    }

    // ── To'lov turini aniqlash (kurs yoki obuna) ──
    let kind: 'course' | 'subscription';
    let priceUzs: number;
    let refId: string; // merchantTransId qismi uchun
    let txnExtra: Record<string, unknown>;

    if (typeof planId === 'string') {
      const plan = await prisma.subscriptionPlan.findFirst({
        where: { id: planId, isActive: true },
        select: { id: true, priceUzs: true },
      });
      if (!plan) return jsonResponse({ error: 'Plan topilmadi' }, { status: 404 });
      kind = 'subscription';
      priceUzs = Number(plan.priceUzs);
      refId = 'SUB';
      txnExtra = { kind: 'subscription', planId: plan.id, courseId: null };
    } else if (typeof courseId === 'string') {
      const course = await prisma.course.findFirst({
        where: { id: courseId, isPublished: true },
        select: { id: true, priceUzs: true },
      });
      if (!course) return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });
      priceUzs = Number(course.priceUzs);
      if (priceUzs <= 0) {
        return jsonResponse({ error: 'Bu kurs bepul — /api/courses/[id]/enroll ishlatiladi' }, { status: 400 });
      }
      const existing = await prisma.enrollment.findUnique({
        where: { studentId_courseId: { studentId: session.sub, courseId } },
        select: { isActive: true },
      });
      if (existing?.isActive) {
        return jsonResponse({ error: 'Siz allaqachon bu kursga yozilgansiz' }, { status: 409 });
      }
      // Obuna chegirmasi — obunachi chegirmali narxda to'laydi (o'qituvchi chegirmali
      // summadan ulush oladi). all-access (100%) bo'lsa — bepul enroll ishlatilsin.
      const discountPct = await getSubscriberDiscountPct(session.sub);
      if (discountPct >= 100) {
        return jsonResponse(
          { error: 'Obunangiz bu kursni to\'liq qoplaydi — bepul yozilish ishlatiladi.', code: 'FREE_VIA_SUBSCRIPTION' },
          { status: 400 },
        );
      }
      const originalUzs = priceUzs;
      priceUzs = applyDiscount(priceUzs, discountPct);
      kind = 'course';
      refId = courseId.slice(0, 8);
      txnExtra = {
        kind: 'course',
        courseId,
        ...(discountPct > 0 ? { metadata: { originalUzs, discountPct } } : {}),
      };
    } else {
      throw new ValidationError('courseId yoki planId majburiy');
    }

    // ── Gateway sozlanganmi? ──
    const clickMerchantId = process.env.CLICK_MERCHANT_ID;
    const clickServiceId = process.env.CLICK_SERVICE_ID;
    const paymeKey = process.env.PAYME_MERCHANT_ID;
    const gatewayConfigured =
      (paymentMethod === 'click' && !!clickMerchantId && !!clickServiceId) ||
      (paymentMethod === 'payme' && !!paymeKey);

    // PRODUCTION'da gateway yo'q bo'lsa — soxta success YARATMAYMIZ
    if (!gatewayConfigured && process.env.NODE_ENV === 'production') {
      return jsonResponse(
        { error: "To'lov tizimi hozircha sozlanmagan. Iltimos keyinroq urinib ko'ring.", code: 'GATEWAY_NOT_CONFIGURED' },
        { status: 503 },
      );
    }

    const merchantTransId = `${session.sub.slice(0, 8)}-${refId}-${Date.now()}`;
    const transaction = await prisma.paymentTransaction.create({
      data: {
        studentId: session.sub,
        amountUzs: BigInt(priceUzs),
        currency: 'UZS',
        paymentMethod: paymentMethod as PaymentMethod,
        status: 'pending',
        merchantTransId,
        ...txnExtra,
      },
    });

    // ── Payment URL ──
    let paymentUrl = '';
    if (paymentMethod === 'click' && gatewayConfigured) {
      const returnUrl = encodeURIComponent(`${SITE_URL}/payment-success-confirmation?transaction_id=${transaction.id}`);
      paymentUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${priceUzs}&transaction_param=${merchantTransId}&return_url=${returnUrl}`;
    } else if (paymentMethod === 'payme' && gatewayConfigured) {
      const params = Buffer.from(JSON.stringify({ m: paymeKey, ac: { order_id: merchantTransId }, a: priceUzs * 100, l: 'uz' })).toString('base64');
      paymentUrl = `https://checkout.paycom.uz/${params}`;
    } else {
      // Faqat dev — mock oqimi (success sahifasi mock-complete'ni chaqiradi)
      paymentUrl = `${SITE_URL}/payment-success-confirmation?transaction_id=${transaction.id}&mock=1`;
    }

    return jsonResponse({
      transactionId: transaction.id,
      paymentUrl,
      amount: priceUzs,
      currency: 'UZS',
      kind,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
