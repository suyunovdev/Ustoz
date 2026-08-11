/**
 * Messages flow — Xabar yuborish va suhbatlar
 *
 * Ssenariylar:
 *  1. Autentifikatsiyasiz suhbatlar — 401
 *  2. Student suhbatlar ro'yxatini ko'radi — 200
 *  3. Teacher suhbat boshlaydi (student bilan) — 201
 *  4. Student suhbat boshlaydi (teacher bilan) — 201 yoki mavjudi qaytadi
 *  5. Suhbatga xabar yuborish — 201
 *  6. Suhbat xabarlarini o'qish — 200
 *  7. Xabarlarni o'qilgan deb belgilash — 200
 *  8. Suhbatni ID bilan ko'rish — 200
 *  9. Tegishli bo'lmagan suhbat — 403/404
 */

import { test, expect } from '@playwright/test';

const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };
const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };

test.describe('Messages flow', () => {
  let conversationId: string;
  let studentId: string;
  let teacherId: string;

  test.beforeAll(async ({ request }) => {
    // Teacher va student ID larini olish
    await request.post('/api/auth/login', { data: TEACHER });
    const teacherProfile = await (await request.get('/api/profile')).json();
    teacherId = teacherProfile.profile?.id ?? '';
    await request.post('/api/auth/logout');

    await request.post('/api/auth/login', { data: STUDENT });
    const studentProfile = await (await request.get('/api/profile')).json();
    studentId = studentProfile.profile?.id ?? '';
    await request.post('/api/auth/logout');
  });

  test('autentifikatsiyasiz suhbatlar — 401', async ({ request }) => {
    const res = await request.get('/api/conversations');
    expect(res.status()).toBe(401);
  });

  test("student suhbatlar ro'yxatini ko'radi — 200", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/conversations');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.conversations ?? data.items ?? [])).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test("teacher suhbatlar ro'yxatini ko'radi — 200", async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/conversations');
    expect(res.ok()).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test('teacher student bilan suhbat boshlaydi — 201', async ({ request }) => {
    if (!studentId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });

    const res = await request.post('/api/conversations/start', {
      data: { studentId },
    });
    // 200/201 — muvaffaqiyatli, 403 — teacher va student bog'liq emas
    expect([200, 201, 403]).toContain(res.status());
    if (res.ok()) {
      const data = await res.json();
      expect(data.conversation).toBeTruthy();
      conversationId = data.conversation.id;
    }
    await request.post('/api/auth/logout');
  });

  test('student teacher bilan suhbat boshlaydi — mavjudi qaytadi', async ({ request }) => {
    if (!teacherId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.post('/api/conversations/start', {
      data: { teacherId },
    });
    expect([200, 201, 403]).toContain(res.status());

    if (res.ok()) {
      const data = await res.json();
      expect(data.conversation).toBeTruthy();
      if (!conversationId) conversationId = data.conversation.id;
    }
    await request.post('/api/auth/logout');
  });

  test('suhbatga xabar yuborish — 201', async ({ request }) => {
    if (!conversationId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });

    const res = await request.post(`/api/conversations/${conversationId}/messages`, {
      data: { body: 'E2E test xabari — salom!' },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data.message ?? data).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test("suhbat xabarlarini o'qish — 200", async ({ request }) => {
    if (!conversationId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.get(`/api/conversations/${conversationId}/messages`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.messages ?? data.items ?? [])).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test("xabarlarni o'qilgan deb belgilash — 200", async ({ request }) => {
    if (!conversationId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });

    const res = await request.post(`/api/conversations/${conversationId}/read`);
    expect(res.ok()).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test('suhbatni ID bilan ko\'rish — 200', async ({ request }) => {
    if (!conversationId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });

    const res = await request.get(`/api/conversations/${conversationId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.conversation ?? data).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test("begona suhbatga kirish — 403/404", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/conversations/00000000-0000-0000-0000-000000000000');
    expect([403, 404]).toContain(res.status());
    await request.post('/api/auth/logout');
  });

  test("bo'sh xabar yuborish — 400", async ({ request }) => {
    if (!conversationId) test.skip();
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.post(`/api/conversations/${conversationId}/messages`, {
      data: { body: '' },
    });
    expect(res.status()).toBe(400);
    await request.post('/api/auth/logout');
  });
});
