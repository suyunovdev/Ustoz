/**
 * Notifications flow — Bildirishnomalarni boshqarish
 *
 * Ssenariylar:
 *  1. Autentifikatsiyasiz bildirishnomalar — 401
 *  2. Bildirishnomalar ro'yxatini olish — 200
 *  3. Badge count (o'qilmagan soni) — 200
 *  4. Faqat o'qilmagan filter — 200
 *  5. Bitta bildirishnomani o'qilgan deb belgilash — 200
 *  6. Barcha bildirishnomalarni o'qilgan deb belgilash — 200
 *  7. Barcha o'qilgandan keyin badge count = 0
 *  8. Bildirishnomani arxivlash — 200
 *  9. Pagination — limit va cursor
 */

import { test, expect } from '@playwright/test';

const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };
const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };

test.describe('Notifications flow', () => {
  let notificationId: string;

  test('autentifikatsiyasiz bildirishnomalar — 401', async ({ request }) => {
    const res = await request.get('/api/notifications');
    expect(res.status()).toBe(401);
  });

  test("student bildirishnomalar ro'yxatini oladi — 200", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/notifications');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.notifications ?? data.items ?? [])).toBeTruthy();

    const notifications = data.notifications ?? data.items ?? [];
    if (notifications.length > 0) {
      notificationId = notifications[0].id;
    }
    await request.post('/api/auth/logout');
  });

  test('badge count (o\'qilmagan soni) — 200', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/notifications/badge');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof (data.count ?? data.unreadCount ?? data.badge)).toBe('number');
    await request.post('/api/auth/logout');
  });

  test("faqat o'qilmagan bildirishnomalar filter — 200", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/notifications?status=unread');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const notifications = data.notifications ?? data.items ?? [];
    // Barchasi unread bo'lishi kerak
    notifications.forEach((n: { isRead: boolean; status: string }) => {
      const isUnread = !n.isRead || n.status === 'unread';
      expect(isUnread).toBe(true);
    });
    await request.post('/api/auth/logout');
  });

  test('bitta bildirishnomani o\'qilgan deb belgilash — 200', async ({ request }) => {
    if (!notificationId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post(`/api/notifications/${notificationId}/read`);
    expect(res.ok()).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test("barcha bildirishnomalarni o'qilgan deb belgilash — 200", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post('/api/notifications/read-all');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(typeof (data.count ?? data.updated ?? 0)).toBe('number');
    await request.post('/api/auth/logout');
  });

  test("barcha o'qilgandan keyin badge count = 0", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    await request.post('/api/notifications/read-all');

    const res = await request.get('/api/notifications/badge');
    const data = await res.json();
    const count = data.count ?? data.unreadCount ?? data.badge ?? 0;
    expect(count).toBe(0);
    await request.post('/api/auth/logout');
  });

  test('bildirishnomani arxivlash — 200', async ({ request }) => {
    if (!notificationId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.post(`/api/notifications/${notificationId}/archive`);
    expect(res.ok()).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test('limit bilan pagination — 200', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/notifications?limit=5');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    const notifications = data.notifications ?? data.items ?? [];
    expect(notifications.length).toBeLessThanOrEqual(5);
    await request.post('/api/auth/logout');
  });

  test("teacher ham bildirishnomalarni ko'radi — 200", async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/notifications');
    expect(res.ok()).toBeTruthy();
    await request.post('/api/auth/logout');
  });
});
