/**
 * Earnings repository — teacher daromad va withdrawals.
 *
 * Balans hisoblash:
 *   gross        = SUM(completed payments)
 *   refunded     = SUM(refunded payments)
 *   netRevenue   = (gross - refunded) × (1 - platformFee)
 *   withdrawn    = SUM(completed withdrawals)
 *   pending      = SUM(pending + processing withdrawals)
 *   available    = netRevenue - withdrawn - pending
 *
 * platformFee — env-dan o'qiladi (default 15%)
 */

import { prisma } from '@/lib/prisma';

export const PLATFORM_FEE_PCT = Number(process.env.PLATFORM_FEE_PCT ?? '15');

export interface TeacherBalance {
  grossRevenueUzs: bigint;
  refundedUzs: bigint;
  platformFeePct: number;
  platformFeeUzs: bigint;
  netRevenueUzs: bigint;
  withdrawnUzs: bigint;
  pendingWithdrawalUzs: bigint;
  availableUzs: bigint;
  // Bonus metadata
  completedPaymentCount: number;
  refundedPaymentCount: number;
}

export async function getBalance(teacherId: string): Promise<TeacherBalance> {
  const rows = await prisma.$queryRaw<
    Array<{
      gross: bigint;
      refunded: bigint;
      completedCount: bigint;
      refundedCount: bigint;
      withdrawn: bigint;
      pending: bigint;
    }>
  >`
    SELECT
      COALESCE((SELECT SUM(pt.amount_uzs)::bigint FROM payment_transactions pt
        JOIN courses c ON c.id = pt.course_id
        WHERE c.teacher_id = ${teacherId}::uuid AND pt.status = 'completed'), 0) AS gross,
      COALESCE((SELECT SUM(pt.amount_uzs)::bigint FROM payment_transactions pt
        JOIN courses c ON c.id = pt.course_id
        WHERE c.teacher_id = ${teacherId}::uuid AND pt.status = 'refunded'), 0) AS refunded,
      COALESCE((SELECT COUNT(*)::bigint FROM payment_transactions pt
        JOIN courses c ON c.id = pt.course_id
        WHERE c.teacher_id = ${teacherId}::uuid AND pt.status = 'completed'), 0) AS "completedCount",
      COALESCE((SELECT COUNT(*)::bigint FROM payment_transactions pt
        JOIN courses c ON c.id = pt.course_id
        WHERE c.teacher_id = ${teacherId}::uuid AND pt.status = 'refunded'), 0) AS "refundedCount",
      COALESCE((SELECT SUM(amount_uzs)::bigint FROM teacher_withdrawals
        WHERE teacher_id = ${teacherId}::uuid AND status = 'completed'), 0) AS withdrawn,
      COALESCE((SELECT SUM(amount_uzs)::bigint FROM teacher_withdrawals
        WHERE teacher_id = ${teacherId}::uuid AND status IN ('pending', 'processing')), 0) AS pending
  `;
  const r = rows[0];

  const grossNet = r.gross - r.refunded;
  const platformFeeUzs =
    grossNet > BigInt(0)
      ? (grossNet * BigInt(Math.round(PLATFORM_FEE_PCT * 100))) / BigInt(10000)
      : BigInt(0);
  const netRevenueUzs = grossNet - platformFeeUzs;
  const available = netRevenueUzs - r.withdrawn - r.pending;

  return {
    grossRevenueUzs: r.gross,
    refundedUzs: r.refunded,
    platformFeePct: PLATFORM_FEE_PCT,
    platformFeeUzs,
    netRevenueUzs,
    withdrawnUzs: r.withdrawn,
    pendingWithdrawalUzs: r.pending,
    availableUzs: available > BigInt(0) ? available : BigInt(0),
    completedPaymentCount: Number(r.completedCount),
    refundedPaymentCount: Number(r.refundedCount),
  };
}

// ==================== PAYMENTS ====================

export type PaymentStatusFilter =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export interface TeacherPaymentRow {
  id: string;
  amountUzs: bigint;
  currency: string;
  status: string;
  paymentMethod: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseId: string;
  createdAt: Date;
  completedAt: Date | null;
  refundedAt: Date | null;
  refundReason: string | null;
}

export async function listPayments(
  teacherId: string,
  filters: {
    status?: PaymentStatusFilter;
    courseId?: string;
    limit?: number;
    cursor?: string;
  } = {},
): Promise<{ rows: TeacherPaymentRow[]; nextCursor: string | null }> {
  const limit = filters.limit ?? 50;
  const where: any = {
    course: { teacherId },
  };
  if (filters.status) where.status = filters.status;
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.cursor) where.id = { lt: filters.cursor };

  const rows = await prisma.paymentTransaction.findMany({
    where,
    include: {
      student: { select: { fullName: true, email: true } },
      course: { select: { title: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  return {
    rows: items.map((r) => ({
      id: r.id,
      amountUzs: r.amountUzs,
      currency: r.currency,
      status: r.status,
      paymentMethod: r.paymentMethod,
      studentName: r.student.fullName,
      studentEmail: r.student.email,
      courseTitle: r.course.title,
      courseId: r.courseId,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
      refundedAt: r.refundedAt,
      refundReason: r.refundReason,
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

// ==================== WITHDRAWALS ====================

export type WithdrawalStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export type WithdrawalMethod = 'bank_transfer' | 'card';

export interface WithdrawalRow {
  id: string;
  teacherId: string;
  amountUzs: bigint;
  status: string;
  method: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  cardNumber: string | null;
  recipientName: string | null;
  note: string | null;
  adminNote: string | null;
  rejectionReason: string | null;
  processedById: string | null;
  requestedAt: Date;
  processedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
}

export interface CreateWithdrawalInput {
  teacherId: string;
  amountUzs: bigint;
  method: WithdrawalMethod;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  cardNumber?: string | null;
  recipientName?: string | null;
  note?: string | null;
}

export async function createWithdrawal(
  input: CreateWithdrawalInput,
): Promise<WithdrawalRow> {
  return prisma.teacherWithdrawal.create({
    data: {
      teacherId: input.teacherId,
      amountUzs: input.amountUzs,
      method: input.method,
      bankName: input.bankName ?? null,
      bankAccountNumber: input.bankAccountNumber ?? null,
      cardNumber: input.cardNumber ?? null,
      recipientName: input.recipientName ?? null,
      note: input.note ?? null,
      status: 'pending',
    },
  });
}

export async function findWithdrawalById(id: string): Promise<WithdrawalRow | null> {
  return prisma.teacherWithdrawal.findUnique({ where: { id } });
}

export async function listTeacherWithdrawals(
  teacherId: string,
  filters: { status?: WithdrawalStatus; limit?: number } = {},
): Promise<WithdrawalRow[]> {
  const where: any = { teacherId };
  if (filters.status) where.status = filters.status;
  return prisma.teacherWithdrawal.findMany({
    where,
    orderBy: { requestedAt: 'desc' },
    take: filters.limit ?? 50,
  });
}

export async function cancelWithdrawal(id: string): Promise<WithdrawalRow> {
  return prisma.teacherWithdrawal.update({
    where: { id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
}

// ==================== PAYOUT SETTINGS ====================

export interface PayoutSettings {
  payoutBankName: string | null;
  payoutAccountNumber: string | null;
  payoutRecipientName: string | null;
  payoutCardNumber: string | null;
}

export async function getPayoutSettings(
  teacherId: string,
): Promise<PayoutSettings> {
  const u = await prisma.userProfile.findUnique({
    where: { id: teacherId },
    select: {
      payoutBankName: true,
      payoutAccountNumber: true,
      payoutRecipientName: true,
      payoutCardNumber: true,
    },
  });
  return {
    payoutBankName: u?.payoutBankName ?? null,
    payoutAccountNumber: u?.payoutAccountNumber ?? null,
    payoutRecipientName: u?.payoutRecipientName ?? null,
    payoutCardNumber: u?.payoutCardNumber ?? null,
  };
}

export async function updatePayoutSettings(
  teacherId: string,
  input: Partial<PayoutSettings>,
): Promise<PayoutSettings> {
  const updated = await prisma.userProfile.update({
    where: { id: teacherId },
    data: {
      ...(input.payoutBankName !== undefined && { payoutBankName: input.payoutBankName }),
      ...(input.payoutAccountNumber !== undefined && {
        payoutAccountNumber: input.payoutAccountNumber,
      }),
      ...(input.payoutRecipientName !== undefined && {
        payoutRecipientName: input.payoutRecipientName,
      }),
      ...(input.payoutCardNumber !== undefined && {
        payoutCardNumber: input.payoutCardNumber,
      }),
    },
    select: {
      payoutBankName: true,
      payoutAccountNumber: true,
      payoutRecipientName: true,
      payoutCardNumber: true,
    },
  });
  return updated;
}
