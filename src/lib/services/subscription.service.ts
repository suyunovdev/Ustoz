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
import { createNotification } from '@/lib/repositories/notification.repository';
import { handlePaymentCompleted } from '@/lib/repositories/referral.repository';

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
 * Foydalanuvchida shu kursga AMALDAGI kirish bormi?
 *   - faol enrollment yo'q → false
 *   - source='direct' (bepul/to'lov/sotib olish) → true (doimiy)
 *   - source='subscription' (all-access obuna orqali) → faqat obuna hali faol bo'lsa true
 * Bu "1 oylik obuna bilan yozilib, obuna tugagach umrbod kirish" teshigini yopadi.
 */
export async function hasActiveCourseAccess(userId: string, courseId: string): Promise<boolean> {
  const enr = await prisma.enrollment.findUnique({
    where: { studentId_courseId: { studentId: userId, courseId } },
    select: { isActive: true, source: true },
  });
  if (!enr || !enr.isActive) return false;
  if (enr.source === 'subscription') return hasAllCoursesAccess(userId);
  return true;
}

// ─── Tier-asosli capability gating ───
// Tarif tier'i imkoniyatlarni belgilaydi: 1=Boshlang'ich, 2=Standart, 3=Premium.
export type SubscriptionCapability =
  | 'certificate' | 'practice_exam' | 'live_sessions' | 'ai_tutor' | 'priority_support';

const CAP_MIN_TIER: Record<SubscriptionCapability, number> = {
  certificate: 1,
  practice_exam: 2,
  live_sessions: 2,
  ai_tutor: 2,
  priority_support: 3,
};

/** Foydalanuvchining faol obunalari ichida eng yuqori tier (obuna yo'q → 0). */
export async function getActivePlanTier(userId: string): Promise<number> {
  const subs = await prisma.subscription.findMany({
    where: { userId, status: 'active', expiresAt: { gt: new Date() } },
    select: { plan: { select: { tier: true } } },
  });
  return subs.reduce((max, s) => Math.max(max, s.plan?.tier ?? 0), 0);
}

/** Foydalanuvchida shu imkoniyat bormi (tarif tier'i bo'yicha). */
export async function hasCapability(userId: string, cap: SubscriptionCapability): Promise<boolean> {
  const tier = await getActivePlanTier(userId);
  return tier >= CAP_MIN_TIER[cap];
}

/** AI-tutor kunlik limiti (tier'ga qarab): tier≥3 → 50, tier≥2 → 20, aks holda 0. */
export async function getAiTutorDailyLimit(userId: string): Promise<number> {
  const tier = await getActivePlanTier(userId);
  if (tier >= 3) return 50;
  if (tier >= 2) return 20;
  return 0;
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

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Yangi obuna tugash sanasini hisoblaydi (proratsiya bilan):
 *   - faol obuna yo'q         → now + newPlan.durationDays
 *   - bir xil reja            → mavjud muddat ustiga qo'shish (oddiy uzaytirish)
 *   - boshqa reja (upgrade/downgrade) → mavjud obunaning QOLGAN pul qiymati yangi
 *     reja kunlik narxiga qayta hisoblanib, yangi reja muddatiga qo'shiladi.
 * Bu "arzon yillik + 1 oy qimmat reja = butun yil qimmat reja" exploit'ini yopadi.
 */
export function computeExpiry(
  now: Date,
  current: { expiresAt: Date; planId: string; plan?: { priceUzs: bigint; durationDays: number } | null } | null,
  newPlan: { id: string; priceUzs: bigint; durationDays: number },
): Date {
  if (!current || current.expiresAt <= now) {
    return new Date(now.getTime() + newPlan.durationDays * DAY_MS);
  }
  if (current.planId === newPlan.id) {
    return new Date(current.expiresAt.getTime() + newPlan.durationDays * DAY_MS);
  }
  const remainingDays = (current.expiresAt.getTime() - now.getTime()) / DAY_MS;
  const curDaily =
    current.plan && current.plan.durationDays > 0
      ? Number(current.plan.priceUzs) / current.plan.durationDays
      : 0;
  const newDaily = newPlan.durationDays > 0 ? Number(newPlan.priceUzs) / newPlan.durationDays : 0;
  const creditDays = newDaily > 0 ? (remainingDays * curDaily) / newDaily : 0;
  return new Date(now.getTime() + (newPlan.durationDays + creditDays) * DAY_MS);
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

  const activated = await prisma.$transaction(async (tx) => {
    // Idempotency — shu tranzaksiya obunasi allaqachon yaratilganmi?
    const already = await tx.subscription.findFirst({
      where: { sourceTransactionId: transactionId },
      select: { id: true },
    });
    if (already) return false;

    // Joriy faol obuna bo'lsa — proratsiya bilan hisoblaymiz (reja almashsa qolgan
    // qiymat yangi rejaga konvertatsiya qilinadi), aks holda now'dan.
    const current = await tx.subscription.findFirst({
      where: { userId, status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
      include: { plan: { select: { priceUzs: true, durationDays: true } } },
    });
    const expiresAt = computeExpiry(new Date(), current, plan);

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
    return true;
  });

  if (activated) {
    await createNotification({
      recipientId: userId,
      type: 'payment',
      title: 'Obunangiz faollashtirildi',
      message: `"${plan.name}" obunasi faollashtirildi. Endi barcha kurslardan foydalanishingiz mumkin.`,
      metadata: { planId, kind: 'subscription' },
      email: true,
    });
  }
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
  paymentMethod: 'click' | 'payme' = 'click',
): Promise<{ id: string; expiresAt: Date }> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) throw new ValidationError('Plan topilmadi');

  const { result, txnId } = await prisma.$transaction(async (tx) => {
    const current = await tx.subscription.findFirst({
      where: { userId, status: 'active', expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
      include: { plan: { select: { priceUzs: true, durationDays: true } } },
    });
    const expiresAt = computeExpiry(new Date(), current, plan);

    // To'lov tarixida ko'rinishi uchun obuna tranzaksiyasi (kind='subscription').
    // Gateway ulanmagan davrda status='completed' — admin tasdig'i to'lov o'rnida.
    // Avval yaratamiz — sourceTransactionId bo'yicha obunani unga bog'laymiz
    // (refund shu bog'lanish orqali obunani bekor qila oladi).
    const txn = await tx.paymentTransaction.create({
      data: {
        studentId: userId,
        kind: 'subscription',
        planId,
        amountUzs: plan.priceUzs,
        currency: 'UZS',
        paymentMethod,
        status: 'completed',
        completedAt: new Date(),
        merchantTransId: `SUB-${crypto.randomUUID()}`,
        metadata: { source: 'manual_grant', planName: plan.name },
      },
      select: { id: true },
    });

    const sub = current
      ? await tx.subscription.update({
          where: { id: current.id },
          data: { planId, expiresAt, status: 'active', sourceTransactionId: txn.id },
          select: { id: true, expiresAt: true },
        })
      : await tx.subscription.create({
          data: { userId, planId, status: 'active', expiresAt, sourceTransactionId: txn.id },
          select: { id: true, expiresAt: true },
        });

    return { result: sub, txnId: txn.id };
  });

  // Referral komissiyasi (best-effort) — admin-tasdiq oqimida ham referrer bonus olsin.
  try { await handlePaymentCompleted(txnId); } catch (e) { console.error('[subscription] referral hook:', e); }

  // Bildirishnoma (best-effort, $tx'dan keyin — asosiy oqimni buzmaydi)
  await createNotification({
    recipientId: userId,
    type: 'payment',
    title: 'Obunangiz faollashtirildi',
    message: `"${plan.name}" obunasi faollashtirildi. Endi barcha kurslardan foydalanishingiz mumkin.`,
    metadata: { planId, kind: 'subscription' },
    email: true,
  });

  return result;
}

/** Admin obunani bekor qiladi (status='cancelled'). */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'cancelled' },
  });
}

// ─────────── Obuna so'rovlari (to'lov shlyuzisiz, admin tasdig'i orqali) ───────────

/**
 * Student obuna so'rovi yaratadi (Click/Payme bosganda, gateway ulanmagan holatda).
 * Kutilayotgan so'rov allaqachon bo'lsa — dublikat yaratmaydi, mavjudini qaytaradi.
 */
export async function createSubscriptionRequest(
  userId: string,
  planId: string,
  paymentMethod?: string | null,
): Promise<{ id: string; status: string; alreadyPending: boolean }> {
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw new ValidationError('Reja topilmadi');

  const existing = await prisma.subscriptionRequest.findFirst({
    where: { userId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  if (existing) return { id: existing.id, status: 'pending', alreadyPending: true };

  const created = await prisma.subscriptionRequest.create({
    data: { userId, planId, paymentMethod: paymentMethod ?? null, status: 'pending' },
    select: { id: true, status: true },
  });
  return { ...created, alreadyPending: false };
}

/** Studentning kutilayotgan so'rovi (obuna sahifasida "ko'rib chiqilmoqda" banneri uchun). */
export async function getPendingRequest(userId: string) {
  const r = await prisma.subscriptionRequest.findFirst({
    where: { userId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
    include: { plan: { select: { name: true } } },
  });
  if (!r) return null;
  return { id: r.id, planName: r.plan?.name ?? '—', paymentMethod: r.paymentMethod, createdAt: r.createdAt };
}

/** Admin — so'rovlar ro'yxati (default: kutilayotgan). */
export async function listSubscriptionRequests(status = 'pending') {
  const rows = await prisma.subscriptionRequest.findMany({
    where: status === 'all' ? {} : { status },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { fullName: true, email: true } },
      plan: { select: { name: true, durationDays: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    userName: r.user?.fullName ?? '—',
    userEmail: r.user?.email ?? '',
    planName: r.plan?.name ?? '—',
    durationDays: r.plan?.durationDays ?? 0,
    paymentMethod: r.paymentMethod,
    status: r.status,
    createdAt: r.createdAt,
  }));
}

/** Admin so'rovni TASDIQLAYDI → obuna faollashadi (grantSubscriptionManually). */
export async function approveSubscriptionRequest(
  requestId: string,
  adminId: string,
): Promise<{ userId: string; expiresAt: Date }> {
  const reqRow = await prisma.subscriptionRequest.findUnique({ where: { id: requestId } });
  if (!reqRow) throw new ValidationError('So\'rov topilmadi');
  if (reqRow.status !== 'pending') throw new ValidationError('So\'rov allaqachon ko\'rib chiqilgan');

  // Atomik status-guard: so'rovni 'pending'dan 'approved'ga faqat bitta chaqiruv
  // o'tkaza oladi. Parallel ikkinchi approve count=0 oladi → grant qilinmaydi
  // (obuna ikki marta uzaymaydi, ikkita tranzaksiya yaratilmaydi).
  const claimed = await prisma.subscriptionRequest.updateMany({
    where: { id: requestId, status: 'pending' },
    data: { status: 'approved', reviewedById: adminId, reviewedAt: new Date() },
  });
  if (claimed.count === 0) throw new ValidationError('So\'rov allaqachon ko\'rib chiqilgan');

  const method = reqRow.paymentMethod === 'payme' ? 'payme' : 'click';
  try {
    const result = await grantSubscriptionManually(reqRow.userId, reqRow.planId, method);
    return { userId: reqRow.userId, expiresAt: result.expiresAt };
  } catch (e) {
    // Grant yiqilsa so'rovni 'pending'ga qaytaramiz — qayta ko'rib chiqish mumkin bo'lsin.
    await prisma.subscriptionRequest.updateMany({
      where: { id: requestId, status: 'approved' },
      data: { status: 'pending', reviewedById: null, reviewedAt: null },
    });
    throw e;
  }
}

/** Admin so'rovni RAD ETADI. */
export async function rejectSubscriptionRequest(requestId: string, adminId: string): Promise<void> {
  const reqRow = await prisma.subscriptionRequest.findUnique({
    where: { id: requestId },
    select: { id: true, status: true },
  });
  if (!reqRow) throw new ValidationError('So\'rov topilmadi');
  // Faqat 'pending' so'rovni rad etish mumkin (tasdiqlangan so'rovni rad etib bo'lmaydi).
  if (reqRow.status !== 'pending') throw new ValidationError('So\'rov allaqachon ko\'rib chiqilgan');
  await prisma.subscriptionRequest.updateMany({
    where: { id: requestId, status: 'pending' },
    data: { status: 'rejected', reviewedById: adminId, reviewedAt: new Date() },
  });
}
