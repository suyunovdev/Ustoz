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
import { paymentRepo, type AdminTransactionRow, type ListTransactionsFilters } from '@/lib/repositories';
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

  return prisma.$transaction(async (tx) => {
    // 1) Tranzaksiya status'i yangilanadi
    const updated = await paymentRepo.markRefunded(
      txId,
      { reason, refundedById: adminId },
      tx,
    );

    // 2) Enrollment'ni deaktivatsiya qilish (kurs ro'yxatidan olib tashlanadi)
    const deactivated = await tx.enrollment.updateMany({
      where: { studentId: target.studentId, courseId: target.courseId, isActive: true },
      data: { isActive: false },
    });

    // 2a) Course enrollment counter dekrementi (faqat haqiqatda deaktivatsiya bo'lganda)
    if (deactivated.count > 0) {
      await tx.course.update({
        where: { id: target.courseId },
        data: { enrollmentCount: { decrement: deactivated.count } },
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
}
