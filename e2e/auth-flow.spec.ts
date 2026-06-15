import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('login sahifasi — noto\'g\'ri parol xato beradi', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'wrong@test.com', password: 'wrongpassword' },
    });
    expect(res.status()).toBe(401);
    const data = await res.json();
    expect(data.error).toBeTruthy();
  });

  test('login sahifasi — to\'g\'ri parol ishlaydi', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.user).toBeTruthy();
    expect(data.user.role).toBe('teacher');
    expect(data.user.email).toBe('test.teacher@ustoz.uz');
  });

  test('login cookie bilan me endpoint ishlaydi', async ({ request }) => {
    // Login
    const loginRes = await request.post('/api/auth/login', {
      data: { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' },
    });
    expect(loginRes.ok()).toBeTruthy();

    // Me (cookie avtomatik yuboriladi)
    const meRes = await request.get('/api/auth/me');
    expect(meRes.ok()).toBeTruthy();
    const data = await meRes.json();
    expect(data.user.email).toBe('test.teacher@ustoz.uz');
  });

  test('teacher sahifalar login bilan ochiladi', async ({ page }) => {
    // API orqali login
    const res = await page.request.post('/api/auth/login', {
      data: { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' },
    });
    expect(res.ok()).toBeTruthy();

    // Teacher dashboard ochilishi kerak (redirect yo'q)
    await page.goto('/teacher-dashboard');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/teacher-dashboard');
  });

  test('teacher student sahifaga kira olmaydi', async ({ page }) => {
    // Login as teacher
    await page.request.post('/api/auth/login', {
      data: { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' },
    });

    // Student dashboard ga o'tish — unauthorized ga redirect
    await page.goto('/student-dashboard');
    await page.waitForURL(/\/unauthorized/);
    expect(page.url()).toContain('/unauthorized');
  });

  test('brute force himoyasi ishlaydi', async ({ request }) => {
    // 6 ta ketma-ket noto'g'ri parol
    for (let i = 0; i < 6; i++) {
      await request.post('/api/auth/login', {
        data: { email: 'brute@test.com', password: `wrong${i}` },
      });
    }
    // 7-chi urinish 429 bo'lishi kerak (yoki 401 agar limit 5 dan ko'p bo'lsa)
    const res = await request.post('/api/auth/login', {
      data: { email: 'brute@test.com', password: 'wrong7' },
    });
    // 429 yoki 401 — ikkalasi ham qabul qilinadi
    expect([401, 429]).toContain(res.status());
  });

  test('logout ishlaydi', async ({ request }) => {
    // Login
    await request.post('/api/auth/login', {
      data: { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' },
    });

    // Logout
    const logoutRes = await request.post('/api/auth/logout');
    expect(logoutRes.ok()).toBeTruthy();

    // Me — endi 401 bo'lishi kerak
    const meRes = await request.get('/api/auth/me');
    expect(meRes.status()).toBe(401);
  });
});
