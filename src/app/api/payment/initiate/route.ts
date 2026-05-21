import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Kirish talab qilinadi' }, { status: 401 });
    }

    // Rate limiting: foydalanuvchi uchun 10 so'rov / daqiqa
    const rateLimitKey = `payment:${user.id}`;
    const { allowed, remaining, resetAt } = checkRateLimit(rateLimitKey, 10, 60 * 1000);

    if (!allowed) {
      const retryAfterSec = Math.ceil((resetAt - Date.now()) / 1000);
      return NextResponse.json(
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
      return NextResponse.json({ error: 'courseId kiritilmagan' }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(courseId)) {
      return NextResponse.json({ error: 'courseId formati noto\'g\'ri' }, { status: 400 });
    }

    if (!paymentMethod || !['click', 'payme'].includes(paymentMethod)) {
      return NextResponse.json({ error: 'To\'lov usuli: click yoki payme bo\'lishi kerak' }, { status: 400 });
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, price_uzs, is_published')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: 'Kurs topilmadi' }, { status: 404 });
    }

    if (!course.is_published) {
      return NextResponse.json({ error: 'Kurs sotuvda mavjud emas' }, { status: 400 });
    }

    if (!course.price_uzs || course.price_uzs <= 0) {
      return NextResponse.json({ error: 'Kurs narxi noto\'g\'ri' }, { status: 400 });
    }

    // Allaqachon yozilganmi?
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .single();

    if (existingEnrollment) {
      return NextResponse.json({ error: 'Siz bu kursga allaqachon yozilgansiz' }, { status: 400 });
    }

    const merchantTransId = `${Date.now()}_${user.id.substring(0, 8)}_${courseId.substring(0, 8)}`;

    const { data: transaction, error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        student_id: user.id,
        course_id: courseId,
        amount_uzs: course.price_uzs,
        payment_method: paymentMethod,
        status: 'pending',
        merchant_trans_id: merchantTransId,
        metadata: {
          course_title: course.title,
          created_from: 'web',
        },
      })
      .select()
      .single();

    if (transactionError || !transaction) {
      console.error('Transaction create error:', transactionError);
      return NextResponse.json({ error: 'Tranzaksiya yaratishda xatolik' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4028';
    let paymentUrl = '';

    if (paymentMethod === 'click') {
      const clickMerchantId = process.env.CLICK_MERCHANT_ID;
      const clickServiceId = process.env.CLICK_SERVICE_ID;

      if (!clickMerchantId || !clickServiceId) {
        return NextResponse.json({ error: 'Click to\'lovi sozlanmagan' }, { status: 500 });
      }

      paymentUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${course.price_uzs}&transaction_param=${merchantTransId}&return_url=${encodeURIComponent(appUrl + '/transaction-history')}`;
    } else if (paymentMethod === 'payme') {
      const paymeMerchantId = process.env.PAYME_MERCHANT_ID;

      if (!paymeMerchantId) {
        return NextResponse.json({ error: 'Payme to\'lovi sozlanmagan' }, { status: 500 });
      }

      const paymeParams = {
        m: paymeMerchantId,
        ac: { order_id: merchantTransId },
        a: course.price_uzs * 100, // tiyin
        c: appUrl + '/transaction-history',
      };

      const encodedParams = Buffer.from(JSON.stringify(paymeParams)).toString('base64');
      paymentUrl = `https://checkout.paycom.uz/${encodedParams}`;
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      merchantTransId,
      paymentUrl,
      amount: course.price_uzs,
      remaining,
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    return NextResponse.json({ error: 'Server xatosi' }, { status: 500 });
  }
}
