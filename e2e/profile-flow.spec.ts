/**
 * Profile flow — Profil ko'rish va yangilash
 *
 * Ssenariylar:
 *  1. Autentifikatsiyasiz profil — 401
 *  2. Teacher profilini ko'radi — 200
 *  3. Student profilini ko'radi — 200
 *  4. Profil to'liq ma'lumotlari tekshiriladi
 *  5. fullName yangilash — 200
 *  6. bio yangilash — 200
 *  7. Bir necha maydon birga yangilash — 200
 *  8. Yangilangandan keyin ma'lumotlar saqlanganini tekshirish
 *  9. Public teacher profili — /api/teachers/[id]
 */

import { test, expect } from '@playwright/test';

const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };
const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };

test.describe('Profile flow', () => {
  let teacherId: string;

  test('autentifikatsiyasiz profil — 401', async ({ request }) => {
    const res = await request.get('/api/profile');
    expect(res.status()).toBe(401);
  });

  test('teacher profilini ko\'radi — 200', async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/profile');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.profile).toBeTruthy();
    expect(data.profile.email).toBe(TEACHER.email);
    expect(data.profile.role).toBe('teacher');
    teacherId = data.profile.id;
    await request.post('/api/auth/logout');
  });

  test('student profilini ko\'radi — 200', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/profile');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.profile).toBeTruthy();
    expect(data.profile.email).toBe(STUDENT.email);
    await request.post('/api/auth/logout');
  });

  test('profil majburiy maydonlarni o\'z ichiga oladi', async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/profile');
    const data = await res.json();
    const profile = data.profile;
    expect(profile).toHaveProperty('id');
    expect(profile).toHaveProperty('email');
    expect(profile).toHaveProperty('fullName');
    expect(profile).toHaveProperty('role');
    await request.post('/api/auth/logout');
  });

  test('fullName yangilash — 200', async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const original = await (await request.get('/api/profile')).json();
    const originalName = original.profile.fullName;

    const res = await request.patch('/api/profile', {
      data: { fullName: 'E2E Test Teacher' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.profile.fullName).toBe('E2E Test Teacher');

    // Qayta asl nomga qaytarish
    await request.patch('/api/profile', { data: { fullName: originalName } });
    await request.post('/api/auth/logout');
  });

  test('bio yangilash — 200', async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.patch('/api/profile', {
      data: { bio: 'E2E test uchun yozilgan bio' },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.profile.bio).toBe('E2E test uchun yozilgan bio');
    await request.post('/api/auth/logout');
  });

  test('bir necha maydon birga yangilash — 200', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.patch('/api/profile', {
      data: {
        fullName: 'E2E Test Student',
        bio: 'Test bio',
        headline: 'Test talabasi',
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.profile.bio).toBe('Test bio');
    await request.post('/api/auth/logout');
  });

  test('yangilangandan keyin ma\'lumotlar saqlanadi', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    await request.patch('/api/profile', { data: { bio: 'Tekshirish bio' } });

    const res = await request.get('/api/profile');
    const data = await res.json();
    expect(data.profile.bio).toBe('Tekshirish bio');
    await request.post('/api/auth/logout');
  });

  test("public teacher profili — /api/teachers/[id]", async ({ request }) => {
    if (!teacherId) test.skip();
    const res = await request.get(`/api/teachers/${teacherId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.teacher ?? data.profile).toBeTruthy();
  });
});
