/**
 * Subscription (obuna) service.
 *
 * Plan-based obuna: bir nechta plan, davr-bo'yicha QO'LDA to'lov (avto-charge yo'q).
 * Faol `allCoursesAccess` obuna → foydalanuvchi istalgan kursga bepul yozila oladi
 * (access mavjud enrollment tizimi orqali beriladi — enroll route obunani hisobga oladi).
 */
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';

export function serializePlan(p: {
  id: string; name: string; description: string | null; priceUzs: bigint;
  durationDays: number; tier: number; features: string[]; allCoursesAccess: boolean;
  isActive: boolean; sortOrder: number;
}) {
  return {
    id: p.id, name: p.name, description: p.description,
    priceUzs: p.priceUzs.toString(), durationDays: p.durationDays,
    tier: p.tier, features: p.features, allCoursesAccess: p.allCoursesAccess,
    isActive: p.isActive, sortOrder: p.sortOrder,
  };
}

/** Faol planlar (marketplace/obuna sahifasi uchun). */
export async function listActivePlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  return plans.map(serializePlan);
}

/** Foydalanuvchining joriy FAOL obunasi (plan bilan) yoki null. */
export async function getActiveSubscription(userId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { userId, status: 'active', expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: 'desc' },
    include: { plan: true },
  });
  if (!sub) return null;
  return {
    id: sub.id,
    status: sub.status,
    startedAt: sub.startedAt,
    expiresAt: sub.expiresAt,
    plan: serializePlan(sub.plan),
  };
}

/** Foydalanuvchida barcha kurslarga kirish beruvchi faol obuna bormi? */
export async function hasAllCoursesAccess(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expiresAt: { gt: new Date() },
      plan: { allCoursesAccess: true },
    },
    select: { id: true },
  });
  return sub !== null;
}

/**
 * Foydalanuvchida umuman faol obuna bormi (reja turidan qat'i nazar).
 * Obunaga xos premium funksiyalarni (AI yordamchi, sertifikat va h.k.)
 * gating qilish uchun.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: 'active',
      expiresAt: { gt: new Date() },
    },
    select: { id: true },
  });
  return sub !== null;
}

// Obunachi kurs chegirmasi (foizda). Env: SUBSCRIBER_COURSE_DISCOUNT_PCT (0–100).
export const SUBSCRIBER_COURSE_DISCOUNT_PCT = (() => {
  const raw = Number(process.env.SUBSCRIBER_COURSE_DISCOUNT_PCT);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
})();

/**
 * Foydalanuvchining pullik kurslarga obuna chegirmasi (0–100).
 *   - all-access reja → 100 (bepul; enroll orqali)
 *   - boshqa faol obuna → SUBSCRIBER_COURSE_DISCOUNT_PCT
 *   - obuna yo'q → 0
 * Bir nechta obuna bo'lsa — eng foydalisi (kattasi) tanlanadi.
 */
export async function getSubscriberDiscountPct(userId: string): Promise<number> {
  const subs = await prisma.subscription.findMany({
    where: { userId, status: 'active', expiresAt: { gt: new Date() } },
    select: { plan: { select: { allCoursesAccess: true } } },
  });
  if (subs.length === 0) return 0;
  if (subs.some((s) => s.plan.allCoursesAccess)) return 100;
  return SUBSCRIBER_COURSE_DISCOUNT_PCT;
}

/** Narxga chegirma qo'llab, butun so'mgacha yaxlitlaydi (100 ming'gача emas). */
export function applyDiscount(priceUzs: number, discountPct: number): number {
  if (discountPct <= 0) return priceUzs;
  if (discountPct >= 100) return 0;
  return Math.round((priceUzs * (100 - discountPct)) / 100);
}

/**
 * To'lov muvaffaqiyatli bo'lgach obunani faollashtiradi/uzaytiradi.
 * Webhook (click/complete, payme) yoki dev mock-complete'dan chaqiriladi.
 * Idempotent: shu tranzaksiya bo'yicha allaqachon obuna bo'lsa qayta yaratmaydi.
 */
export async function activateSubscriptionFromPayment(
  userId: string,
  planId: string,
  transactionId: string,
): Promise<void> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new ValidationError('Plan topilmadi');

  await prisma.$transaction(async (tx) => {
    // Idempotency — shu tranzaksiya obunasi allaqachon yaratilganmi?
    const already = await tx.subscription.findFirst({
      where: { sourceTransactionId: transactionId },
      select: { id: true },
    });
    if (already) return;

    // Joriy faol obuna bo'lsa — uzaytiramiz (expiresAt + durationDays), aks holda now'dan
    const current = await tx.subscription.findFirst({
      where: { userId, status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });
    const base = current && current.expiresAt > new Date() ? current.expiresAt : new Date();
    const expiresAt = new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    if (current) {
      // Mavjud obunani uzaytirish + planni yangilash
      await tx.subscription.update({
        where: { id: current.id },
        data: { planId, expiresAt, status: 'active', sourceTransactionId: transactionId },
      });
    } else {
      await tx.subscription.create({
        data: { userId, planId, status: 'active', expiresAt, sourceTransactionId: transactionId },
      });
    }
  });
}
