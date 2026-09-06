import { describe, it, expect, vi } from 'vitest';

// subscription.service modul yuklanishida bu importlarni chaqiradi — mock qilamiz
// (computeExpiry/applyDiscount toza funksiyalar, DB'ga tegmaydi).
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
vi.mock('./platform-settings.service', () => ({ getSubscriberCourseDiscountSetting: () => 40 }));
vi.mock('@/lib/repositories/notification.repository', () => ({ createNotification: vi.fn() }));
vi.mock('@/lib/repositories/referral.repository', () => ({ handlePaymentCompleted: vi.fn() }));

import { computeExpiry, applyDiscount } from '../subscription.service';

const DAY = 24 * 60 * 60 * 1000;
const daysBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / DAY;

describe('applyDiscount', () => {
  it('chegirmasiz — o\'zgarmaydi', () => expect(applyDiscount(100000, 0)).toBe(100000));
  it('40% chegirma', () => expect(applyDiscount(100000, 40)).toBe(60000));
  it('100% — bepul', () => expect(applyDiscount(100000, 100)).toBe(0));
});

describe('computeExpiry — proratsiya', () => {
  const now = new Date('2026-01-01T00:00:00Z');
  const boshlangichYillik = { id: 'b-year', priceUzs: BigInt(790000), durationDays: 365 };
  const premiumOylik = { id: 'p-month', priceUzs: BigInt(249000), durationDays: 30 };

  it('faol obuna yo\'q → now + durationDays', () => {
    const exp = computeExpiry(now, null, premiumOylik);
    expect(Math.round(daysBetween(now, exp))).toBe(30);
  });

  it('bir xil reja → mavjud muddat ustiga qo\'shiladi', () => {
    const current = { expiresAt: new Date(now.getTime() + 100 * DAY), planId: 'p-month', plan: { priceUzs: BigInt(249000), durationDays: 30 } };
    const exp = computeExpiry(now, current, premiumOylik);
    expect(Math.round(daysBetween(now, exp))).toBe(130); // 100 qolgan + 30 yangi
  });

  it('reja almashtirish (arzon yillik → qimmat oylik) EXPLOIT yopilgan', () => {
    // Boshlang'ich yillik (790k) faol, 365 kun qolgan → Premium oylik (249k) olinadi.
    const current = { expiresAt: new Date(now.getTime() + 365 * DAY), planId: 'b-year', plan: { priceUzs: BigInt(790000), durationDays: 365 } };
    const exp = computeExpiry(now, current, premiumOylik);
    const days = daysBetween(now, exp);
    // Proratsiya: 30 + (790000/8300) ≈ 125 kun — 365 kun EMAS (exploit yopilgan).
    expect(days).toBeGreaterThan(120);
    expect(days).toBeLessThan(135);
    expect(days).toBeLessThan(365);
  });

  it('muddati o\'tgan obuna → now dan boshlanadi', () => {
    const current = { expiresAt: new Date(now.getTime() - 5 * DAY), planId: 'p-month', plan: { priceUzs: BigInt(249000), durationDays: 30 } };
    const exp = computeExpiry(now, current, boshlangichYillik);
    expect(Math.round(daysBetween(now, exp))).toBe(365);
  });
});
