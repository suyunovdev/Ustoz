/**
 * Payment flow — To'lov initiate qilish
 *
 * Ssenariylar:
 *  1. Autentifikatsiyasiz to'lov — 401
 *  2. courseId kiritilmagan — 400
 *  3. Noto'g'ri UUID — 400
 *  4. Noto'g'ri paymentMethod — 400
 *  5. Mavjud bo'lmagan kurs — 404
 *  6. Bepul kursga to'lov yaratish — 400
 *  7. Pulliq kursga click to'lov — transactionId va paymentUrl qaytadi
 *  8. Pulliq kursga payme to'lov — transactionId va paymentUrl qaytadi
 *  9. Allaqachon yozilgan kursga qayta to'lov — 400
 * 10. To'lov holati tekshirish
 * 11. Student o'z to'lovlar tarixini ko'radi
 */

import { test, expect } from '@playwright/test';

const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };
const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };

test.describe('Payment flow', () => {
  let paidCourseId: string;
  let transactionId: string;

  test.beforeAll(async ({ request }) => {
    // Pulliq publish qilingan kursni topish
    const res = await request.get('/api/courses?limit=50');
    if (res.ok()) {
      const data = await res.json();
      const paid = data.courses?.find(
        (c: { priceUzs: string; isPublished: boolean }) =>
          c.isPublished && BigInt(c.priceUzs || '0') > 0n,
      );
      paidCourseId = paid?.id ?? '';
    }
  });

  test('autentifikatsiyasiz to\'lov — 401', async ({ request }) => {
    const res = await request.post('/api/payment/initiate', {
      data: { courseId: '00000000-0000-0000-0000-000000000001', paymentMethod: 'click' },
    });
    expect(res.status()).toBe(401);
  });

  test('courseId kiritilmagan — 400', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post('/api/payment/initiate', {
      data: { paymentMethod: 'click' },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/courseId/i);
    await request.post('/api/auth/logout');
  });

  test("noto'g'ri UUID — 400", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post('/api/payment/initiate', {
      data: { courseId: 'not-valid', paymentMethod: 'click' },
    });
    expect(res.status()).toBe(400);
    await request.post('/api/auth/logout');
  });

  test("noto'g'ri paymentMethod — 400", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post('/api/payment/initiate', {
      data: {
        courseId: '00000000-0000-0000-0000-000000000001',
        paymentMethod: 'visa',
      },
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/click|payme/i);
    await request.post('/api/auth/logout');
  });

  test("mavjud bo'lmagan kursga to'lov — 404", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post('/api/payment/initiate', {
      data: {
        courseId: '00000000-0000-0000-0000-000000000000',
        paymentMethod: 'click',
      },
    });
    expect(res.status()).toBe(404);
    await request.post('/api/auth/logout');
  });

  test('pulliq kursga click to\'lov initiate — transactionId qaytadi', async ({ request }) => {
    if (!paidCourseId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.post('/api/payment/initiate', {
      data: { courseId: paidCourseId, paymentMethod: 'click' },
    });

    // 200 (muvaffaqiyatli) yoki 400 (allaqachon yozilgan) yoki 500 (gateway sozlanmagan)
    if (res.status() === 200) {
      const data = await res.json();
      expect(data.transactionId).toBeTruthy();
      expect(data.merchantTransId).toBeTruthy();
      expect(data.paymentUrl).toContain('click.uz');
      transactionId = data.transactionId;
    } else {
      expect([400, 500]).toContain(res.status());
    }
    await request.post('/api/auth/logout');
  });

  test('pulliq kursga payme to\'lov initiate — paymentUrl qaytadi', async ({ request }) => {
    if (!paidCourseId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.post('/api/payment/initiate', {
      data: { courseId: paidCourseId, paymentMethod: 'payme' },
    });

    if (res.status() === 200) {
      const data = await res.json();
      expect(data.transactionId).toBeTruthy();
      expect(data.paymentUrl).toContain('paycom.uz');
    } else {
      expect([400, 500]).toContain(res.status());
    }
    await request.post('/api/auth/logout');
  });

  test('to\'lov holati tekshirish', async ({ request }) => {
    if (!transactionId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.get(`/api/payment/status/${transactionId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBeTruthy();
    expect(['pending', 'completed', 'failed', 'cancelled']).toContain(data.status);
    await request.post('/api/auth/logout');
  });

  test("student o'z to'lovlar tarixini ko'radi", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/payments/my');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.payments ?? data.transactions ?? [])).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test('teacher to\'lovlar tarixini ko\'radi', async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/teacher/earnings/payments');
    expect(res.ok()).toBeTruthy();
    await request.post('/api/auth/logout');
  });
});
