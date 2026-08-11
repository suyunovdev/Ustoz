/**
 * Course management — Teacher kurs yaratish va boshqarish
 *
 * Ssenariylar:
 *  1. Student kurs yarata olmaydi — 403
 *  2. Teacher kurs yaratadi — 201
 *  3. Yaratilgan kurs ro'yxatda ko'rinadi
 *  4. Kurs ma'lumotlarini yangilash — 200
 *  5. Noto'g'ri ma'lumot bilan kurs yaratish — 400
 *  6. Boshqa teacherning kursini o'zgartira olmaydi — 403/404
 *  7. Kurs publish qilish
 *  8. Public kurslar ro'yxatida chiqadi
 */

import { test, expect } from '@playwright/test';

const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };
const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };

const newCourse = {
  title: 'E2E Test Kursi',
  description: 'Playwright tomonidan yaratilgan test kursi',
  category: 'Dasturlash va IT',
  targetAudience: 'school_students',
  subjectCategory: 'web_development',
  language: 'uz',
  difficultyLevel: 'beginner',
  priceUzs: 0,
};

test.describe('Course management', () => {
  let createdCourseId: string;

  test('student kurs yarata olmaydi — 403', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post('/api/teacher/courses', { data: newCourse });
    expect(res.status()).toBe(403);
    await request.post('/api/auth/logout');
  });

  test("to'liq ma'lumotsiz kurs yaratish — 400", async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.post('/api/teacher/courses', {
      data: { title: 'Faqat nom' },
    });
    expect(res.status()).toBe(400);
    await request.post('/api/auth/logout');
  });

  test('teacher yangi kurs yaratadi — 201', async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.post('/api/teacher/courses', { data: newCourse });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.course).toBeTruthy();
    expect(data.course.title).toBe(newCourse.title);
    expect(data.course.isPublished).toBe(false);
    createdCourseId = data.course.id;
    await request.post('/api/auth/logout');
  });

  test("yaratilgan kurs teacher ro'yxatida ko'rinadi", async ({ request }) => {
    if (!createdCourseId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/teacher/courses');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const found = data.courses.some((c: { id: string }) => c.id === createdCourseId);
    expect(found).toBe(true);
    await request.post('/api/auth/logout');
  });

  test("kurs ma'lumotlarini yangilash — 200", async ({ request }) => {
    if (!createdCourseId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.patch(`/api/teacher/courses/${createdCourseId}`, {
      data: { title: 'E2E Test Kursi (yangilangan)', description: 'Yangilangan tavsif' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.course.title).toBe('E2E Test Kursi (yangilangan)');
    await request.post('/api/auth/logout');
  });

  test('kurs publish qilish', async ({ request }) => {
    if (!createdCourseId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.patch(`/api/teacher/courses/${createdCourseId}`, {
      data: { isPublished: true },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.course.isPublished).toBe(true);
    await request.post('/api/auth/logout');
  });

  test("publish qilingan kurs public ro'yxatda ko'rinadi", async ({ request }) => {
    if (!createdCourseId) test.skip();
    const res = await request.get('/api/courses?limit=50');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const found = data.courses?.some((c: { id: string }) => c.id === createdCourseId);
    expect(found).toBe(true);
  });

  test('autentifikatsiyasiz teacher API — 401', async ({ request }) => {
    const res = await request.get('/api/teacher/courses');
    expect(res.status()).toBe(401);
  });
});
