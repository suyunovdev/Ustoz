/**
 * Refund Service
 * --------------
 * Admin tomonidan to'lovni qaytarish (refund).
 *
 * Hozircha:
 *   - Status'ni 'refunded' deb belgilash + audit log
 *   - Enrollment.isActive = false (kurs talabaning ro'yxatidan olib tashlanadi)
 *
 * Keyingi iteratsiya:
 *   - Click/Payme API'ga real refund so'rovi
 *   - Webhook callback bilan tasdiqlash
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paymentRepo, earningsRepo, type AdminTransactionRow, type ListTransactionsFilters } from '@/lib/repositories';
import { cancelEarningByTransaction } from '@/lib/repositories/referral.repository';
import { ValidationError } from '@/lib/errors';
import { log as auditLog } from './audit-log.service';

// Faqat shu status'lardagi to'lovni refund qilish mumkin
const REFUNDABLE_STATUSES = new Set(['completed']);

export class TransactionNotFoundError extends Error {
  code = 'TRANSACTION_NOT_FOUND';
  constructor(id: string) {
    super(`Transaction not found: ${id}`);
    this.name = 'TransactionNotFoundError';
  }
}

export class NotRefundableError extends Error {
  code = 'NOT_REFUNDABLE';
  constructor(status: string) {
    super(`Bu to'lovni qaytarib bo'lmaydi (status: ${status})`);
    this.name = 'NotRefundableError';
  }
}

export interface ListTransactionsResult {
  transactions: AdminTransactionRow[];
  total: number;
  nextCursor: string | null;
  stats: Awaited<ReturnType<typeof paymentRepo.statusCountsForAdmin>>;
  totalRevenueUzs: string;
}

export async function listTransactions(
  filters: ListTransactionsFilters = {},
): Promise<ListTransactionsResult> {
  const limit = filters.limit ?? 20;
  const [rows, total, stats, revenue] = await Promise.all([
    paymentRepo.findAllForAdmin({ ...filters, limit }),
    paymentRepo.countForAdmin({
      status: filters.status,
      method: filters.method,
      search: filters.search,
    }),
    paymentRepo.statusCountsForAdmin(),
    paymentRepo.sumCompletedRevenue(),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    transactions: items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    stats,
    totalRevenueUzs: revenue.toString(),
  };
}

export async function processRefund(
  adminId: string,
  txId: string,
  reason: string,
  request?: NextRequest,
): Promise<AdminTransactionRow> {
  if (!reason || reason.trim().length < 5) {
    throw new ValidationError('Refund sababi kerak (kamida 5 belgi)');
  }

  const target = await paymentRepo.findByIdForAdmin(txId);
  if (!target) throw new TransactionNotFoundError(txId);
  if (!REFUNDABLE_STATUSES.has(target.status)) {
    throw new NotRefundableError(target.status);
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1) Tranzaksiya status'i yangilanadi
    const updated = await paymentRepo.markRefunded(
      txId,
      { reason, refundedById: adminId },
      tx,
    );

    // 2a) Kurs to'lovi refund'i → enrollment'ni deaktivatsiya qilish.
    if (target.courseId) {
      const courseId = target.courseId;
      const deactivated = await tx.enrollment.updateMany({
        where: { studentId: target.studentId, courseId, isActive: true },
        data: { isActive: false },
      });
      if (deactivated.count > 0) {
        await tx.course.update({
          where: { id: courseId },
          data: { enrollmentCount: { decrement: deactivated.count } },
        });
      }
    }

    // 2b) Obuna to'lovi refund'i → shu tranzaksiyaga bog'langan obunani bekor qilish
    // (sourceTransactionId orqali). expiresAt'ni ham hozirgi vaqtga tortamiz —
    // gating darhol to'xtaydi, all-access/AI/sertifikat imtiyozlari o'chadi.
    if (target.kind === 'subscription' || target.planId) {
      await tx.subscription.updateMany({
        where: { sourceTransactionId: txId, status: 'active' },
        data: { status: 'cancelled', expiresAt: new Date() },
      });
    }

    // 3) Audit log
    await auditLog(
      {
        adminId,
        action: 'payment.refund',
        targetType: 'payment',
        targetId: txId,
        metadata: {
          reason,
          amountUzs: target.amountUzs.toString(),
          studentId: target.studentId,
          courseId: target.courseId,
        },
        request,
      },
      tx,
    );

    return updated;
  });

  // Referral komissiyani bekor qilish — refund qilingan sotuv bo'yicha
  // referrerga to'lov qolmasin (best-effort, transaction'dan tashqarida).
  try {
    await cancelEarningByTransaction(txId);
  } catch (e) {
    console.error('[refund] cancelEarningByTransaction failed:', e);
  }

  // Clawback ko'rinuvchanligi (H2/M2) — avtomatik pul qaytarish mexanizmi (ledger)
  // yo'q, shuning uchun qo'lda aralashuv kerak bo'lgan holatlarni audit log'ga yozamiz.
  try {
    // M2 — komissiya ALLAQACHON to'langan bo'lsa: cancelEarningByTransaction faqat
    // 'pending'ni bekor qiladi; 'paid' referrer puli qo'lda clawback qilinishi kerak.
    const earning = await prisma.referralEarning.findUnique({
      where: { sourceTransactionId: txId },
      select: { id: true, status: true, referrerId: true, amountUzs: true },
    });
    if (earning?.status === 'paid') {
      await auditLog({
        adminId,
        action: 'referral.clawback_needed',
        targetType: 'referral_earning',
        targetId: earning.id,
        metadata: {
          reason: 'refund',
          referrerId: earning.referrerId,
          amountUzs: earning.amountUzs.toString(),
          sourceTransactionId: txId,
        },
        request,
      });
    }

    // H2 — refunddan keyin o'qituvchi allaqachon netto ulushidan ko'p yechib bo'lgan
    // bo'lsa (yechilgan + kutilayotgan > net), ortiqcha to'lovni admin ko'rsin.
    if (target.courseId) {
      const course = await prisma.course.findUnique({
        where: { id: target.courseId },
        select: { teacherId: true },
      });
      if (course) {
        const bal = await earningsRepo.getBalance(course.teacherId);
        if (bal.withdrawnUzs + bal.pendingWithdrawalUzs > bal.netRevenueUzs) {
          await auditLog({
            adminId,
            action: 'teacher.overdrawn_after_refund',
            targetType: 'user',
            targetId: course.teacherId,
            metadata: {
              netRevenueUzs: bal.netRevenueUzs.toString(),
              withdrawnUzs: bal.withdrawnUzs.toString(),
              pendingWithdrawalUzs: bal.pendingWithdrawalUzs.toString(),
              sourceTransactionId: txId,
            },
            request,
          });
        }
      }
    }
  } catch (e) {
    console.error('[refund] clawback visibility failed:', e);
  }

  return result;
}
