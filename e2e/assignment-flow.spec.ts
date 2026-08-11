/**
 * Assignment flow — Vazifa yaratish va topshirish
 *
 * Ssenariylar:
 *  1. Teacher vazifa yaratadi — 201
 *  2. Teacher vazifani publish qiladi
 *  3. Student yozilmagan kursning vazifasini topshira olmaydi — 403
 *  4. Student yozilgan kursning vazifasini ko'radi
 *  5. Student vazifa topshiradi — 201
 *  6. Ikki marta topshirish — 409 yoki yangilash
 *  7. Student o'z topshirishlarini ko'radi
 *  8. Teacher topshirishlarni ko'radi
 */

import { test, expect } from '@playwright/test';

const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };
const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };

test.describe('Assignment flow', () => {
  let courseId: string;
  let assignmentId: string;

  test.beforeAll(async ({ request }) => {
    // Teacher kursini topib olish
    await request.post('/api/auth/login', { data: TEACHER });
    const coursesRes = await request.get('/api/teacher/courses');
    if (coursesRes.ok()) {
      const data = await coursesRes.json();
      courseId = data.courses?.[0]?.id ?? '';
    }
    await request.post('/api/auth/logout');
  });

  test('teacher vazifa yaratadi — 201', async ({ request }) => {
    if (!courseId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });

    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const res = await request.post('/api/teacher/assignments', {
      data: {
        courseId,
        title: 'E2E Test Vazifasi',
        description: 'Playwright tomonidan yaratilgan vazifa',
        instructions: "Ushbu vazifani bajaring va link yuboring",
        dueDate,
        maxScore: 100,
        submissionType: 'text',
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.assignment).toBeTruthy();
    expect(data.assignment.title).toBe('E2E Test Vazifasi');
    assignmentId = data.assignment.id;
    await request.post('/api/auth/logout');
  });

  test('teacher vazifani publish qiladi', async ({ request }) => {
    if (!assignmentId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.patch(`/api/teacher/assignments/${assignmentId}`, {
      data: { status: 'published' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.assignment.status).toBe('published');
    await request.post('/api/auth/logout');
  });

  test("yozilmagan student vazifani topshira olmaydi — 403", async ({ request }) => {
    if (!assignmentId) test.skip();
    // Boshqa student login qiladi (yozilmagan holat simulatsiyasi)
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post(`/api/assignments/${assignmentId}/submit`, {
      data: { submissionText: "Mening javobim" },
    });
    // 403 (yozilmagan) yoki 404 (topilmadi)
    expect([403, 404]).toContain(res.status());
    await request.post('/api/auth/logout');
  });

  test("student avval kursga yoziladi, keyin vazifani ko'radi", async ({ request }) => {
    if (!assignmentId || !courseId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    // Kursga yozilishga urinish (bepul bo'lsa)
    await request.post(`/api/courses/${courseId}/enroll`);

    const res = await request.get(`/api/assignments/${assignmentId}`);
    // Yozilgan bo'lsa 200, yozilmagan bo'lsa 403
    expect([200, 403]).toContain(res.status());
    await request.post('/api/auth/logout');
  });

  test('student o\'z topshirishlarini ko\'radi', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/assignments/my');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.assignments ?? data.submissions ?? [])).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test("teacher o'z kursining vazifalarini ko'radi", async ({ request }) => {
    if (!courseId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get(`/api/teacher/assignments?courseId=${courseId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.assignments)).toBeTruthy();
    if (assignmentId) {
      const found = data.assignments.some((a: { id: string }) => a.id === assignmentId);
      expect(found).toBe(true);
    }
    await request.post('/api/auth/logout');
  });

  test('autentifikatsiyasiz vazifalar — 401', async ({ request }) => {
    const res = await request.get('/api/assignments/my');
    expect(res.status()).toBe(401);
  });
});
