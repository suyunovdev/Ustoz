import { test, expect } from '@playwright/test';

test.describe('Public sahifalar', () => {
  test('landing page ochiladi', async ({ page }) => {
    await page.goto('/landing-page');
    await expect(page).toHaveTitle(/Ustoz/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('login sahifasi ochiladi', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Kirish/);
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
  });

  test('register sahifasi ochiladi', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveTitle(/Ro.*yxatdan/);
  });

  test('course marketplace ochiladi', async ({ page }) => {
    await page.goto('/course-marketplace');
    await expect(page).toHaveTitle(/Kurslar/);
  });

  test('himoyalangan sahifa login ga redirect qiladi', async ({ page }) => {
    await page.goto('/student-dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('teacher sahifa login ga redirect qiladi', async ({ page }) => {
    await page.goto('/course-creation');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('admin sahifa login ga redirect qiladi', async ({ page }) => {
    await page.goto('/admin-dashboard');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });
});

test.describe('API health', () => {
  test('health endpoint ishlaydi', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.status).toBe('ok');
    expect(data.database.status).toBe('ok');
  });

  test('stats endpoint ishlaydi', async ({ request }) => {
    const res = await request.get('/api/stats');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('totalCourses');
    expect(data).toHaveProperty('activeStudents');
  });

  test('courses endpoint ishlaydi', async ({ request }) => {
    const res = await request.get('/api/courses?limit=2');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data).toHaveProperty('courses');
    expect(data).toHaveProperty('pagination');
  });

  test('himoyalangan API 401 qaytaradi', async ({ request }) => {
    const res = await request.get('/api/payments/my');
    expect(res.status()).toBe(401);
  });
});
