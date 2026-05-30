/**
 * Moderation repository — `moderation_queue` + `moderation_history` jadvallari uchun.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma, ModerationStatus } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const queueInclude = {
  material: {
    select: {
      id: true,
      title: true,
      description: true,
      contentType: true,
      fileFormat: true,
      fileUrl: true,
      externalLink: true,
      moderationStatus: true,
      teacher: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      course: { select: { id: true, title: true } },
    },
  },
  reviewer: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.ModerationQueueInclude;

export type ModerationQueueRow = Prisma.ModerationQueueGetPayload<{
  include: typeof queueInclude;
}>;

export type ModerationStatusFilter = ModerationStatus | 'all';

export interface ModerationQueueFilters {
  status?: ModerationStatusFilter;
  contentType?: string | 'all';
  search?: string;
  limit?: number;
  cursor?: string | null;
}

function buildWhere(filters: ModerationQueueFilters): Prisma.ModerationQueueWhereInput {
  const { status, contentType, search } = filters;
  return {
    ...(status && status !== 'all' ? { status } : {}),
    ...(contentType && contentType !== 'all'
      ? { material: { contentType } }
      : {}),
    ...(search
      ? {
          OR: [
            { material: { title: { contains: search, mode: 'insensitive' } } },
            {
              material: {
                teacher: { fullName: { contains: search, mode: 'insensitive' } },
              },
            },
            { material: { teacher: { email: { contains: search, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  };
}

export async function findQueueForAdmin(
  filters: ModerationQueueFilters = {},
): Promise<ModerationQueueRow[]> {
  const { limit = 20, cursor } = filters;
  return prisma.moderationQueue.findMany({
    where: buildWhere(filters),
    include: queueInclude,
    orderBy: [{ status: 'asc' }, { submittedAt: 'desc' }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function countForAdmin(filters: ModerationQueueFilters = {}): Promise<number> {
  return prisma.moderationQueue.count({ where: buildWhere(filters) });
}

export async function statusCounts(): Promise<{
  total: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
  revision_requested: number;
  avgReviewMinutes: number;
}> {
  const grouped = await prisma.moderationQueue.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const counts = {
    total: 0,
    submitted: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    revision_requested: 0,
    draft: 0,
    avgReviewMinutes: 0,
  };
  for (const row of grouped) {
    counts.total += row._count._all;
    counts[row.status] = row._count._all;
  }

  // O'rtacha review vaqti (reviewedAt - submittedAt)
  const reviewed = await prisma.moderationQueue.findMany({
    where: { reviewedAt: { not: null } },
    select: { submittedAt: true, reviewedAt: true },
    take: 200,
  });
  if (reviewed.length > 0) {
    const totalMs = reviewed.reduce((sum, r) => {
      if (!r.reviewedAt) return sum;
      return sum + (r.reviewedAt.getTime() - r.submittedAt.getTime());
    }, 0);
    counts.avgReviewMinutes = Math.round(totalMs / reviewed.length / 60_000);
  }

  return counts;
}

export async function findById(id: string): Promise<ModerationQueueRow | null> {
  return prisma.moderationQueue.findUnique({
    where: { id },
    include: queueInclude,
  });
}

export async function updateStatus(
  queueId: string,
  data: {
    status: ModerationStatus;
    reviewerId: string;
    feedback?: string | null;
  },
  tx?: Prisma.TransactionClient,
): Promise<ModerationQueueRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.moderationQueue.update({
    where: { id: queueId },
    data: {
      status: data.status,
      reviewerId: data.reviewerId,
      feedback: data.feedback ?? null,
      reviewedAt: new Date(),
    },
    include: queueInclude,
  });
}

export async function updateMaterialStatus(
  materialId: string,
  status: ModerationStatus,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  await client.courseMaterial.update({
    where: { id: materialId },
    data: { moderationStatus: status, reviewedAt: new Date() },
  });
}

export async function appendHistory(
  data: {
    materialId: string;
    reviewerId: string;
    action: string;
    status: ModerationStatus;
    feedback?: string | null;
  },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  await client.moderationHistory.create({
    data: {
      materialId: data.materialId,
      reviewerId: data.reviewerId,
      action: data.action,
      status: data.status,
      feedback: data.feedback ?? null,
    },
  });
}

export async function getMaterialHistory(
  materialId: string,
  limit = 20,
): Promise<
  Array<{
    id: string;
    action: string;
    status: ModerationStatus;
    feedback: string | null;
    createdAt: Date;
    reviewer: { id: string; fullName: string } | null;
  }>
> {
  return prisma.moderationHistory.findMany({
    where: { materialId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      reviewer: { select: { id: true, fullName: true } },
    },
  });
}
