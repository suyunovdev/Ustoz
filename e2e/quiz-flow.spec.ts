/**
 * Quiz / Test flow — Test yaratish va topshirish
 *
 * Ssenariylar:
 *  1. Teacher test yaratadi — 201
 *  2. Teacher savol qo'shadi — 201
 *  3. Teacher testni publish qiladi
 *  4. Autentifikatsiyasiz test — 401
 *  5. Mavjud bo'lmagan test — 404
 *  6. Foydalanuvchi testni ko'radi — savollar bilan
 *  7. Student javoblarni topshiradi — natija qaytadi
 *  8. Natijada passed/failed va foiz ko'rinadi
 *  9. Bir necha urinishlar saqlanadi
 */

import { test, expect } from '@playwright/test';

const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };
const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };

test.describe('Quiz / Test flow', () => {
  let courseId: string;
  let testId: string;
  let questionId: string;

  test.beforeAll(async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/teacher/courses');
    if (res.ok()) {
      const data = await res.json();
      courseId = data.courses?.[0]?.id ?? '';
    }
    await request.post('/api/auth/logout');
  });

  test('teacher yangi test yaratadi — 201', async ({ request }) => {
    if (!courseId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });

    const res = await request.post('/api/teacher/tests', {
      data: {
        courseId,
        title: 'E2E Test Savollari',
        description: 'Playwright tomonidan yaratilgan test',
        passingScore: 60,
        timeLimitSec: 600,
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.test).toBeTruthy();
    testId = data.test.id;
    await request.post('/api/auth/logout');
  });

  test('teacher testga savol qo\'shadi — 201', async ({ request }) => {
    if (!testId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });

    const res = await request.post(`/api/teacher/tests/${testId}/questions`, {
      data: {
        questionText: "Next.js qaysi framework asosida qurilgan?",
        questionType: 'single',
        options: [
          { text: 'React', isCorrect: true },
          { text: 'Vue', isCorrect: false },
          { text: 'Angular', isCorrect: false },
          { text: 'Svelte', isCorrect: false },
        ],
        explanation: "Next.js React asosida qurilgan framework",
      },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.question).toBeTruthy();
    questionId = data.question.id;
    await request.post('/api/auth/logout');
  });

  test("autentifikatsiyasiz test ko'rish — 401", async ({ request }) => {
    if (!testId) test.skip();
    const res = await request.get(`/api/tests/${testId}`);
    expect(res.status()).toBe(401);
  });

  test("mavjud bo'lmagan test — 404", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/tests/00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBe(404);
    await request.post('/api/auth/logout');
  });

  test('foydalanuvchi testni savollar bilan ko\'radi', async ({ request }) => {
    if (!testId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.get(`/api/tests/${testId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.test).toBeTruthy();
    expect(data.test.title).toBe('E2E Test Savollari');
    expect(Array.isArray(data.test.questions)).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test('student javoblarni topshiradi — natija qaytadi', async ({ request }) => {
    if (!testId || !questionId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.post(`/api/tests/${testId}/submit`, {
      data: {
        answers: [{ questionId, answer: 'React' }],
        courseId,
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof data.percentage).toBe('number');
    expect(typeof data.passed).toBe('boolean');
    expect(typeof data.score).toBe('number');
    expect(typeof data.maxScore).toBe('number');
    expect(Array.isArray(data.details)).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test('javob topshirish — details to\'g\'ri strukturada', async ({ request }) => {
    if (!testId || !questionId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.post(`/api/tests/${testId}/submit`, {
      data: {
        answers: [{ questionId, answer: 'Vue' }],
        courseId,
      },
    });
    const data = await res.json();
    expect(data.details[0]).toHaveProperty('questionId');
    expect(data.details[0]).toHaveProperty('submittedAnswer');
    expect(data.details[0]).toHaveProperty('isCorrect');
    await request.post('/api/auth/logout');
  });

  test("student o'z urinishlarini ko'radi", async ({ request }) => {
    if (!testId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.get(`/api/tests/${testId}/my-attempts`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.attempts)).toBeTruthy();
    await request.post('/api/auth/logout');
  });
});
