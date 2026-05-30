/**
 * Referral Service.
 *
 * Imkoniyatlar:
 *   - Mening kodim + stats
 *   - Earnings ro'yxati (filter status, cursor)
 *   - Click track (public)
 *   - Attribution (signup vaqtida login pipeline'idan chaqirilishi mumkin)
 *   - Payment hook (PaymentTransaction.completed → earning yaratish)
 */

import { referralRepo, type EarningStatus } from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';

export class InvalidReferralCodeError extends Error {
  code = 'INVALID_REFERRAL_CODE';
  constructor() {
    super("Referral kod yaroqsiz yoki topilmadi");
    this.name = 'InvalidReferralCodeError';
  }
}

const VALID_STATUSES = new Set<EarningStatus>(['pending', 'paid', 'cancelled']);

function serializeStats(s: Awaited<ReturnType<typeof referralRepo.getStats>>) {
  return {
    code: s.code,
    clicks: s.clicks,
    signups: s.signups,
    payingUsers: s.payingUsers,
    conversionPct: s.clicks > 0 ? Math.round((s.signups / s.clicks) * 100) : 0,
    totalEarnedUzs: s.totalEarnedUzs.toString(),
    pendingEarningsUzs: s.pendingEarningsUzs.toString(),
    paidEarningsUzs: s.paidEarningsUzs.toString(),
  };
}

export async function getMyReferralInfo(userId: string) {
  const code = await referralRepo.ensureReferralCode(userId);
  const stats = await referralRepo.getStats(userId);
  return serializeStats({ ...stats, code });
}

export async function listMyEarnings(
  userId: string,
  filters: { status?: string; cursor?: string } = {},
) {
  const status =
    filters.status && VALID_STATUSES.has(filters.status as EarningStatus)
      ? (filters.status as EarningStatus)
      : undefined;
  const result = await referralRepo.listEarnings(userId, {
    status,
    cursor: filters.cursor,
  });
  return {
    rows: result.rows.map((e) => ({
      ...e,
      amountUzs: e.amountUzs.toString(),
    })),
    nextCursor: result.nextCursor,
  };
}

export async function trackClick(code: string): Promise<void> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed || trimmed.length > 12) {
    throw new ValidationError("Yaroqsiz kod");
  }
  const info = await referralRepo.findByCode(trimmed);
  if (!info) throw new InvalidReferralCodeError();
  await referralRepo.incrementClicks(trimmed);
}

/**
 * Login/signup pipeline'da chaqirish uchun helper.
 * Cookie/header'dan ref kod oladi.
 */
export async function attributeOnSignup(
  newUserId: string,
  referralCode: string | null,
): Promise<boolean> {
  if (!referralCode) return false;
  const trimmed = referralCode.trim().toUpperCase();
  if (!trimmed) return false;
  return referralRepo.attributeReferral(newUserId, trimmed);
}

// Re-export payment hook (PaymentTransaction handler'idan chaqirilishi mumkin)
export { handlePaymentCompleted, cancelEarningByTransaction } from '@/lib/repositories/referral.repository';
