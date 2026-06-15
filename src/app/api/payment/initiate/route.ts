import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jsonResponse } from '@/lib/json';
import { checkRateLimit } from '@/lib/rateLimit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return jsonResponse({ error: 'Kirish talab qilinadi' }, { status: 401 });
    }

    // Rate limiting: foydalanuvchi uchun 10 so'rov / daqiqa
    const rateLimitKey = `payment:${session.sub}`;
    const { allowed, remaining, resetAt } = await checkRateLimit(rateLimitKey, 10, 60 * 1000);

    if (!allowed) {
      const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
      return jsonResponse(
        { error: 'Juda ko\'p to\'lov so\'rovi. 1 daqiqadan keyin urinib ko\'ring.' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSec) },
        }
      );
    }

    const body = await request.json();
    const { courseId, paymentMethod } = body;

    // Input validation
    if (!courseId || typeof courseId !== 'string') {
      return jsonResponse({ error: 'courseId kiritilmagan' }, { status: 400 });
    }

    if (!UUID_RE.test(courseId)) {
      return jsonResponse({ error: 'courseId formati noto\'g\'ri' }, { status: 400 });
    }

    if (!paymentMethod || !['click', 'payme'].includes(paymentMethod)) {
      return jsonResponse(
        { error: 'To\'lov usuli: click yoki payme bo\'lishi kerak' },
        { status: 400 }
      );
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, priceUzs: true, isPublished: true },
    });

    if (!course) {
      return jsonResponse({ error: 'Kurs topilmadi' }, { status: 404 });
    }

    if (!course.isPublished) {
      return jsonResponse({ error: 'Kurs sotuvda mavjud emas' }, { status: 400 });
    }

    if (!course.priceUzs || course.priceUzs <= BigInt(0)) {
      return jsonResponse({ error: 'Kurs narxi noto\'g\'ri' }, { status: 400 });
    }

    // Allaqachon yozilganmi?
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: session.sub,
          courseId,
        },
      },
      select: { id: true },
    });

    if (existingEnrollment) {
      return jsonResponse(
        { error: 'Siz bu kursga allaqachon yozilgansiz' },
        { status: 400 }
      );
    }

    const merchantTransId = `${Date.now()}_${session.sub.substring(0, 8)}_${courseId.substring(0, 8)}`;

    const transaction = await prisma.paymentTransaction.create({
      data: {
        studentId: session.sub,
        courseId,
        amountUzs: course.priceUzs,
        paymentMethod: paymentMethod as 'click' | 'payme',
        status: 'pending',
        merchantTransId,
        metadata: {
          course_title: course.title,
          created_from: 'web',
        },
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4028';
    let paymentUrl = '';

    if (paymentMethod === 'click') {
      const clickMerchantId = process.env.CLICK_MERCHANT_ID;
      const clickServiceId = process.env.CLICK_SERVICE_ID;

      if (!clickMerchantId || !clickServiceId) {
        return jsonResponse({ error: 'Click to\'lovi sozlanmagan' }, { status: 500 });
      }

      paymentUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${course.priceUzs.toString()}&transaction_param=${merchantTransId}&return_url=${encodeURIComponent(appUrl + '/transaction-history')}`;
    } else if (paymentMethod === 'payme') {
      const paymeMerchantId = process.env.PAYME_MERCHANT_ID;

      if (!paymeMerchantId) {
        return jsonResponse({ error: 'Payme to\'lovi sozlanmagan' }, { status: 500 });
      }

      const paymeParams = {
        m: paymeMerchantId,
        ac: { order_id: merchantTransId },
        a: Number(course.priceUzs) * 100, // tiyin
        c: appUrl + '/transaction-history',
      };

      const encodedParams = Buffer.from(JSON.stringify(paymeParams)).toString('base64');
      paymentUrl = `https://checkout.paycom.uz/${encodedParams}`;
    }

    return jsonResponse({
      success: true,
      transactionId: transaction.id,
      merchantTransId,
      paymentUrl,
      amount: course.priceUzs,
      remaining,
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
