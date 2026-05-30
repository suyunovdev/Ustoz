/**
 * Referral repository.
 *
 * Imkoniyatlar:
 *   - Foydalanuvchi uchun unique referral kod generatsiya
 *   - Click tracking (anonim)
 *   - Earning create (transactional, on payment completed)
 *   - Aggregate stats (clicks, signups, paying users, total earned)
 *   - Earnings list (cursor pagination)
 */

import { prisma } from '@/lib/prisma';
import { randomBytes } from 'node:crypto';

export type EarningStatus = 'pending' | 'paid' | 'cancelled';

export interface ReferralCodeInfo {
  code: string;
  ownerId: string;
}

// ==================== CODE GENERATION ====================

function generateCode(): string {
  // 8 chars from base32-like alphabet (no confusing chars)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[bytes[i] % alphabet.length];
  }
  return code;
}

/**
 * Foydalanuvchi uchun referral code (yo'q bo'lsa generate qiladi).
 * Idempotent — qayta chaqirishda mavjudini qaytaradi.
 */
export async function ensureReferralCode(userId: string): Promise<string> {
  const existing = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    const collision = await prisma.userProfile.findUnique({
      where: { referralCode: code },
      select: { id: true },
    });
    if (collision) continue;
    await prisma.userProfile.update({
      where: { id: userId },
      data: { referralCode: code },
    });
    return code;
  }
  throw new Error('REFERRAL_CODE_GEN_FAILED');
}

export async function findByCode(code: string): Promise<ReferralCodeInfo | null> {
  const u = await prisma.userProfile.findUnique({
    where: { referralCode: code },
    select: { id: true, referralCode: true },
  });
  if (!u || !u.referralCode) return null;
  return { code: u.referralCode, ownerId: u.id };
}

// ==================== CLICK TRACKING ====================

export async function incrementClicks(code: string): Promise<void> {
  await prisma.userProfile.updateMany({
    where: { referralCode: code },
    data: { referralClicks: { increment: 1 } },
  });
}

// ==================== ATTRIBUTION ====================

/**
 * Yangi signup'da `referred_by_id` ni set qilish (faqat hech qachon attributed bo'lmagan bo'lsa).
 */
export async function attributeReferral(
  newUserId: string,
  referrerCode: string,
): Promise<boolean> {
  const referrer = await findByCode(referrerCode);
  if (!referrer) return false;
  // O'zini-o'zi attribute qilolmaydi
  if (referrer.ownerId === newUserId) return false;

  const u = await prisma.userProfile.findUnique({
    where: { id: newUserId },
    select: { referredById: true },
  });
  if (!u || u.referredById) return false;

  await prisma.userProfile.update({
    where: { id: newUserId },
    data: {
      referredById: referrer.ownerId,
      referredAt: new Date(),
    },
  });
  return true;
}

// ==================== EARNINGS ====================

export interface CreateEarningInput {
  referrerId: string;
  referredUserId: string;
  sourceTransactionId: string;
  courseId: string;
  amountUzs: bigint;
  commissionPct: number;
}

/**
 * Payment completed bo'lganda chaqiriladi.
 * Idempotent — bitta transactionId uchun ikkita earning yozmaydi (DB unique).
 */
export async function createEarning(
  input: CreateEarningInput,
): Promise<{ id: string; created: boolean }> {
  try {
    const created = await prisma.referralEarning.create({
      data: {
        referrerId: input.referrerId,
        referredUserId: input.referredUserId,
        sourceTransactionId: input.sourceTransactionId,
        courseId: input.courseId,
        amountUzs: input.amountUzs,
        commissionPct: input.commissionPct,
        status: 'pending',
      },
    });
    return { id: created.id, created: true };
  } catch (err: any) {
    // Unique constraint violation — already exists
    if (err?.code === 'P2002') {
      const existing = await prisma.referralEarning.findUnique({
        where: { sourceTransactionId: input.sourceTransactionId },
        select: { id: true },
      });
      if (existing) return { id: existing.id, created: false };
    }
    throw err;
  }
}

export async function cancelEarningByTransaction(
  transactionId: string,
): Promise<void> {
  await prisma.referralEarning.updateMany({
    where: { sourceTransactionId: transactionId, status: 'pending' },
    data: { status: 'cancelled' },
  });
}

export async function markEarningPaid(id: string): Promise<void> {
  await prisma.referralEarning.update({
    where: { id },
    data: { status: 'paid', paidAt: new Date() },
  });
}

// ==================== STATS ====================

export interface ReferralStats {
  code: string | null;
  clicks: number;
  signups: number;
  payingUsers: number;
  totalEarnedUzs: bigint;
  pendingEarningsUzs: bigint;
  paidEarningsUzs: bigint;
}

export async function getStats(userId: string): Promise<ReferralStats> {
  const profile = await prisma.userProfile.findUnique({
    where: { id: userId },
    select: { referralCode: true, referralClicks: true },
  });

  const rows = await prisma.$queryRaw<
    Array<{
      signups: bigint;
      payingUsers: bigint;
      pending: bigint;
      paid: bigint;
      total: bigint;
    }>
  >`
    SELECT
      (SELECT COUNT(*)::bigint FROM user_profiles WHERE referred_by_id = ${userId}::uuid) AS signups,
      (SELECT COUNT(DISTINCT referred_user_id)::bigint FROM referral_earnings
        WHERE referrer_id = ${userId}::uuid AND status != 'cancelled') AS "payingUsers",
      COALESCE(SUM(amount_uzs) FILTER (WHERE status = 'pending'), 0)::bigint AS pending,
      COALESCE(SUM(amount_uzs) FILTER (WHERE status = 'paid'), 0)::bigint AS paid,
      COALESCE(SUM(amount_uzs) FILTER (WHERE status IN ('pending', 'paid')), 0)::bigint AS total
    FROM referral_earnings
    WHERE referrer_id = ${userId}::uuid
  `;
  const r = rows[0];

  return {
    code: profile?.referralCode ?? null,
    clicks: profile?.referralClicks ?? 0,
    signups: Number(r.signups),
    payingUsers: Number(r.payingUsers),
    totalEarnedUzs: r.total,
    pendingEarningsUzs: r.pending,
    paidEarningsUzs: r.paid,
  };
}

export interface EarningRow {
  id: string;
  referredUserId: string;
  referredUserName: string;
  courseTitle: string | null;
  amountUzs: bigint;
  commissionPct: number;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
}

export async function listEarnings(
  referrerId: string,
  filters: { status?: EarningStatus; cursor?: string; limit?: number } = {},
): Promise<{ rows: EarningRow[]; nextCursor: string | null }> {
  const limit = filters.limit ?? 30;
  const where: any = { referrerId };
  if (filters.status) where.status = filters.status;
  if (filters.cursor) where.id = { lt: filters.cursor };

  const rows = await prisma.referralEarning.findMany({
    where,
    include: {
      referredUser: { select: { fullName: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    rows: items.map((e) => ({
      id: e.id,
      referredUserId: e.referredUserId,
      referredUserName: e.referredUser.fullName,
      courseTitle: e.course?.title ?? null,
      amountUzs: e.amountUzs,
      commissionPct: e.commissionPct,
      status: e.status,
      createdAt: e.createdAt,
      paidAt: e.paidAt,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// ==================== PAYMENT HOOK ====================

/**
 * Payment 'completed' bo'lganda earning yaratish uchun helper.
 * Aslida payment endpoint'larida chaqiriladi.
 */
export async function handlePaymentCompleted(transactionId: string): Promise<void> {
  const tx = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
    include: {
      student: { select: { id: true, referredById: true } },
    },
  });

  if (!tx) return;
  if (tx.status !== 'completed') return;
  if (!tx.student.referredById) return;

  const commissionPct = Number(process.env.REFERRAL_COMMISSION_PCT ?? '10');
  const amountUzs = (tx.amountUzs * BigInt(commissionPct)) / BigInt(100);

  await createEarning({
    referrerId: tx.student.referredById,
    referredUserId: tx.studentId,
    sourceTransactionId: tx.id,
    courseId: tx.courseId,
    amountUzs,
    commissionPct,
  });
}
