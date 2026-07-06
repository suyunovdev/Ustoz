/**
 * Certificate flow — Sertifikatlarni ko'rish
 *
 * Ssenariylar:
 *  1. Autentifikatsiyasiz sertifikatlar — 401
 *  2. Teacher sertifikat endpoint'ini ishlatib bo'lmaydi — 403
 *  3. Student sertifikatlar ro'yxatini ko'radi — 200
 *  4. Ro'yxat array ko'rinishida — sertifikat strukturasi to'g'ri
 *  5. Mavjud sertifikatni ID bilan ko'rish — 200
 *  6. Mavjud bo'lmagan sertifikat — 404
 *  7. Verifikatsiya URL orqali sertifikat — public
 */

import { test, expect } from '@playwright/test';

const TEACHER = { email: 'test.teacher@ustoz.uz', password: 'Teacher123!' };
const STUDENT = { email: 'test.student@ustoz.uz', password: 'Student123!' };

test.describe('Certificate flow', () => {
  let certificateId: string;
  let certificateNumber: string;

  test('autentifikatsiyasiz sertifikatlar — 401', async ({ request }) => {
    const res = await request.get('/api/certificates/my');
    expect(res.status()).toBe(401);
  });

  test('teacher /api/certificates/my ishlatib bo\'lmaydi — 403', async ({ request }) => {
    await request.post('/api/auth/login', { data: TEACHER });
    const res = await request.get('/api/certificates/my');
    expect(res.status()).toBe(403);
    await request.post('/api/auth/logout');
  });

  test("student sertifikatlar ro'yxatini ko'radi — 200", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/certificates/my');
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(Array.isArray(data.certificates)).toBeTruthy();

    if (data.certificates.length > 0) {
      const cert = data.certificates[0];
      certificateId = cert.id;
      certificateNumber = cert.certificateNumber;
    }
    await request.post('/api/auth/logout');
  });

  test('sertifikat strukturasi to\'g\'ri', async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/certificates/my');
    const data = await res.json();

    if (data.certificates.length > 0) {
      const cert = data.certificates[0];
      expect(cert).toHaveProperty('id');
      expect(cert).toHaveProperty('courseId');
      expect(cert).toHaveProperty('courseTitle');
      expect(cert).toHaveProperty('certificateNumber');
      expect(cert).toHaveProperty('issuedAt');
    }
    await request.post('/api/auth/logout');
  });

  test('sertifikatni ID bilan ko\'rish — 200', async ({ request }) => {
    if (!certificateId) test.skip();
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get(`/api/certificates/${certificateId}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.certificate ?? data).toBeTruthy();
    await request.post('/api/auth/logout');
  });

  test("mavjud bo'lmagan sertifikat — 404", async ({ request }) => {
    await request.post('/api/auth/login', { data: STUDENT });
    const res = await request.get('/api/certificates/00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBe(404);
    await request.post('/api/auth/logout');
  });

  test('verifikatsiya URL orqali sertifikat — public', async ({ request }) => {
    if (!certificateNumber) test.skip();
    // /verify/[number] — public endpoint
    const res = await request.get(`/api/verify/${certificateNumber}`);
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.certificate ?? data.valid).toBeTruthy();
  });
});
