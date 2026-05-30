/**
 * Payment repository — `payment_transactions` jadvali uchun.
 * Admin dashboard revenue stat'lari + transaction'lar boshqaruvi.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma, TransactionStatus, PaymentMethod } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const adminTransactionInclude = {
  student: { select: { id: true, fullName: true, email: true } },
  course: { select: { id: true, title: true, coverImage: true } },
} satisfies Prisma.PaymentTransactionInclude;

export type AdminTransactionRow = Prisma.PaymentTransactionGetPayload<{
  include: typeof adminTransactionInclude;
}>;

export interface ListTransactionsFilters {
  status?: TransactionStatus | 'all';
  method?: PaymentMethod | 'all';
  search?: string; // student email yoki course title
  limit?: number;
  cursor?: string | null;
}

/**
 * `completed` status'idagi tranzaksiyalar summasi (UZS).
 * BigInt qaytaradi — service'da `Number()` yoki string'ga aylantirilishi kerak.
 */
export async function sumCompletedRevenue(since?: Date): Promise<bigint> {
  const result = await prisma.paymentTransaction.aggregate({
    where: {
      status: 'completed',
      ...(since ? { createdAt: { gte: since } } : {}),
    },
    _sum: { amountUzs: true },
  });
  return result._sum.amountUzs ?? BigInt(0);
}

export async function countByStatus(): Promise<{
  completed: number;
  pending: number;
  failed: number;
  total: number;
}> {
  const rows = await prisma.paymentTransaction.groupBy({
    by: ['status'],
    _count: { _all: true },
  });

  const counts = { completed: 0, pending: 0, failed: 0, total: 0 };
  for (const row of rows) {
    counts.total += row._count._all;
    if (row.status === 'completed') counts.completed = row._count._all;
    else if (row.status === 'pending' || row.status === 'processing') {
      counts.pending += row._count._all;
    } else if (row.status === 'failed' || row.status === 'cancelled') {
      counts.failed += row._count._all;
    }
  }
  return counts;
}

/**
 * Oylik daromad (date_trunc('month')) — analytics uchun.
 * `payment_transactions` jadvalida bunday aggregation Prisma'da raw kerak.
 */
export async function monthlyRevenue(
  monthsBack = 6,
): Promise<Array<{ month: Date; revenue: bigint }>> {
  return prisma.$queryRaw<Array<{ month: Date; revenue: bigint }>>`
    SELECT
      date_trunc('month', created_at) AS month,
      COALESCE(SUM(amount_uzs), 0)::bigint AS revenue
    FROM payment_transactions
    WHERE status = 'completed'
      AND created_at >= NOW() - (${monthsBack}::int * INTERVAL '1 month')
    GROUP BY 1
    ORDER BY 1 ASC
  `;
}

// ─── Admin queries ─────────────────────────────────────────────────────────

export async function findAllForAdmin(
  filters: ListTransactionsFilters = {},
): Promise<AdminTransactionRow[]> {
  const { status, method, search, limit = 20, cursor } = filters;

  const where: Prisma.PaymentTransactionWhereInput = {
    ...(status && status !== 'all' ? { status } : {}),
    ...(method && method !== 'all' ? { paymentMethod: method } : {}),
    ...(search
      ? {
          OR: [
            { student: { email: { contains: search, mode: 'insensitive' } } },
            { student: { fullName: { contains: search, mode: 'insensitive' } } },
            { course: { title: { contains: search, mode: 'insensitive' } } },
            { merchantTransId: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  return prisma.paymentTransaction.findMany({
    where,
    include: adminTransactionInclude,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function countForAdmin(
  filters: Pick<ListTransactionsFilters, 'status' | 'method' | 'search'> = {},
): Promise<number> {
  const { status, method, search } = filters;
  return prisma.paymentTransaction.count({
    where: {
      ...(status && status !== 'all' ? { status } : {}),
      ...(method && method !== 'all' ? { paymentMethod: method } : {}),
      ...(search
        ? {
            OR: [
              { student: { email: { contains: search, mode: 'insensitive' } } },
              { student: { fullName: { contains: search, mode: 'insensitive' } } },
              { course: { title: { contains: search, mode: 'insensitive' } } },
              { merchantTransId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
  });
}

export async function statusCountsForAdmin(): Promise<{
  total: number;
  completed: number;
  pending: number;
  failed: number;
  refunded: number;
  cancelled: number;
}> {
  const grouped = await prisma.paymentTransaction.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const counts = { total: 0, completed: 0, pending: 0, failed: 0, refunded: 0, cancelled: 0 };
  for (const row of grouped) {
    counts.total += row._count._all;
    if (row.status === 'completed') counts.completed = row._count._all;
    else if (row.status === 'pending' || row.status === 'processing') {
      counts.pending += row._count._all;
    } else if (row.status === 'failed') counts.failed = row._count._all;
    else if (row.status === 'refunded') counts.refunded = row._count._all;
    else if (row.status === 'cancelled') counts.cancelled = row._count._all;
  }
  return counts;
}

export async function findByIdForAdmin(
  txId: string,
): Promise<AdminTransactionRow | null> {
  return prisma.paymentTransaction.findUnique({
    where: { id: txId },
    include: adminTransactionInclude,
  });
}

export async function markRefunded(
  txId: string,
  data: { reason: string; refundedById: string },
  tx?: Prisma.TransactionClient,
): Promise<AdminTransactionRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.paymentTransaction.update({
    where: { id: txId },
    data: {
      status: 'refunded',
      refundedAt: new Date(),
      refundReason: data.reason,
      refundedById: data.refundedById,
    },
    include: adminTransactionInclude,
  });
}
