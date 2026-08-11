/**
 * Enrollment flow — Student bepul kursga yozilishi
 *
 * Ssenariylar:
 *  1. Login qilinmagan holda enroll — 401
 *  2. Teacher enroll qilishga urinish — 403
 *  3. Noto'g'ri UUID — 400
 *  4. Mavjud bo'lmagan kurs — 404
 *  5. Student bepul kursga muvaffaqiyatli yozilishi — 201
 *  6. Ikki marta yozilish — idempotent
 *  7. Enrollments ro'yxatida kursi ko'rinishi
 *  8. Pulliq kursga to'lovsiz enroll — 400
 */

import { test, expect } from '@playwright/test';

const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };
const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };

test.describe('Enrollment flow', () => {
  let freeCourseId: string;
  let paidCourseId: string;

  test.beforeAll(async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/teacher/courses');
    if (res.ok()) {
      const data = await res.json();
      const free = data.courses?.find(
        (c: { priceUzs: string; isPublished: boolean }) =>
          c.isPublished && c.priceUzs === '0',
      );
      const paid = data.courses?.find(
        (c: { priceUzs: string; isPublished: boolean }) =>
          c.isPublished && BigInt(c.priceUzs || '0') > 0n,
      );
      freeCourseId = free?.id ?? '';
      paidCourseId = paid?.id ?? '';
    }
    await request.post('/api/auth/logout');
  });

  test('autentifikatsiyasiz enroll — 401', async ({ request }) => {
    if (!freeCourseId) test.skip();
    const res = await request.post(`/api/courses/${freeCourseId}/enroll`);
    expect(res.status()).toBe(401);
  });

  test('teacher enroll qilishga urinadi — 403', async ({ request }) => {
    if (!freeCourseId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.post(`/api/courses/${freeCourseId}/enroll`);
    expect(res.status()).toBe(403);
    await request.post('/api/auth/logout');
  });

  test("noto'g'ri UUID bilan enroll — 400", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post('/api/courses/not-a-uuid/enroll');
    expect(res.status()).toBe(400);
    await request.post('/api/auth/logout');
  });

  test("mavjud bo'lmagan kursga enroll — 404", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post('/api/courses/00000000-0000-0000-0000-000000000000/enroll');
    expect(res.status()).toBe(404);
    await request.post('/api/auth/logout');
  });

  test('student bepul kursga muvaffaqiyatli yoziladi', async ({ request }) => {
    if (!freeCourseId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post(`/api/courses/${freeCourseId}/enroll`);
    expect([200, 201]).toContain(res.status());
    const data = await res.json();
    expect(data.enrollment).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test('ikki marta yozilish — idempotent', async ({ request }) => {
    if (!freeCourseId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });
    await request.post(`/api/courses/${freeCourseId}/enroll`);
    const res2 = await request.post(`/api/courses/${freeCourseId}/enroll`);
    expect(res2.ok()).toBeTruthy();
    const data = await res2.json();
    expect(data.message).toMatch(/allaqachon/i);
    await request.post('/api/auth/logout');
  });

  test("enrollments ro'yxatida kursi ko'rinadi", async ({ request }) => {
    if (!freeCourseId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/enrollments/my');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.enrollments)).toBeTruthy();
    const found = data.enrollments.some(
      (e: { courseId: string }) => e.courseId === freeCourseId,
    );
    expect(found).toBe(true);
    await request.post('/api/auth/logout');
  });

  test("pulliq kursga to'lovsiz enroll — 400", async ({ request }) => {
    if (!paidCourseId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post(`/api/courses/${paidCourseId}/enroll`);
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/pullik/i);
    await request.post('/api/auth/logout');
  });
});
