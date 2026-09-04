/**
 * Subscription (obuna) service.
 *
 * Plan-based obuna: bir nechta plan, davr-bo'yicha QO'LDA to'lov (avto-charge yo'q).
 * Faol `allCoursesAccess` obuna → foydalanuvchi istalgan kursga bepul yozila oladi
 * (access mavjud enrollment tizimi orqali beriladi — enroll route obunani hisobga oladi).
 */
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';
import { getSubscriberCourseDiscountSetting } from './platform-settings.service';

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

/**
 * Foydalanuvchining pullik kurslarga obuna chegirmasi (0–100).
 *   - all-access reja → 100 (bepul; enroll orqali)
 *   - boshqa faol obuna → admin panelda sozlangan chegirma foizi
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
  return getSubscriberCourseDiscountSetting();
}

/** Narxga chegirma qo'llab, butun so'mgacha yaxlitlaydi (100 ming'gacha emas). */
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

/**
 * Admin tomonidan QO'LDA obuna berish/faollashtirish (to'lovsiz).
 * Payme/Click to'liq integratsiya qilinmagan davrda admin foydalanuvchiga
 * obunani qo'lda tasdiqlaydi. Mavjud faol obuna bo'lsa — uzaytiradi; yo'q bo'lsa
 * yangi yaratadi. sourceTransactionId = null (to'lovga bog'liq emas).
 */
export async function grantSubscriptionManually(
  userId: string,
  planId: string,
): Promise<{ id: string; expiresAt: Date }> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new ValidationError('Plan topilmadi');

  return prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findFirst({
      where: { userId, status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });
    const base = current && current.expiresAt > new Date() ? current.expiresAt : new Date();
    const expiresAt = new Date(base.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    if (current) {
      const updated = await tx.subscription.update({
        where: { id: current.id },
        data: { planId, expiresAt, status: 'active' },
        select: { id: true, expiresAt: true },
      });
      return updated;
    }
    return tx.subscription.create({
      data: { userId, planId, status: 'active', expiresAt },
      select: { id: true, expiresAt: true },
    });
  });
}

/** Admin obunani bekor qiladi (status='cancelled'). */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'cancelled' },
  });
}
