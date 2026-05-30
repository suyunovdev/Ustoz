/**
 * Teacher Application repository — `teacher_applications` jadvali uchun.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

const applicationInclude = {
  user: { select: { id: true, fullName: true, email: true, role: true, avatarUrl: true } },
} satisfies Prisma.TeacherApplicationInclude;

export type TeacherApplicationRow = Prisma.TeacherApplicationGetPayload<{
  include: typeof applicationInclude;
}>;

export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export interface AdminApplicationsFilters {
  status?: ApplicationStatus | 'all';
  search?: string;
  limit?: number;
  cursor?: string | null;
}

function buildWhere(filters: AdminApplicationsFilters): Prisma.TeacherApplicationWhereInput {
  const { status, search } = filters;
  return {
    ...(status && status !== 'all' ? { status } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { expertise: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

export async function findAllForAdmin(
  filters: AdminApplicationsFilters = {},
): Promise<TeacherApplicationRow[]> {
  const { limit = 20, cursor } = filters;
  return prisma.teacherApplication.findMany({
    where: buildWhere(filters),
    include: applicationInclude,
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], // pending birinchi
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function countForAdmin(
  filters: AdminApplicationsFilters = {},
): Promise<number> {
  return prisma.teacherApplication.count({ where: buildWhere(filters) });
}

export async function statusCountsForAdmin(): Promise<{
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
}> {
  const grouped = await prisma.teacherApplication.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const counts = { total: 0, pending: 0, under_review: 0, approved: 0, rejected: 0 };
  for (const row of grouped) {
    counts.total += row._count._all;
    if (row.status === 'pending') counts.pending = row._count._all;
    else if (row.status === 'under_review') counts.under_review = row._count._all;
    else if (row.status === 'approved') counts.approved = row._count._all;
    else if (row.status === 'rejected') counts.rejected = row._count._all;
  }
  return counts;
}

export async function findById(id: string): Promise<TeacherApplicationRow | null> {
  return prisma.teacherApplication.findUnique({
    where: { id },
    include: applicationInclude,
  });
}

export async function findActiveByUser(userId: string): Promise<TeacherApplicationRow | null> {
  return prisma.teacherApplication.findFirst({
    where: {
      userId,
      status: { in: ['pending', 'under_review'] },
    },
    include: applicationInclude,
  });
}

export interface CreateApplicationInput {
  userId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  expertise: string;
  bio: string;
  motivation: string;
  experience?: string | null;
  sampleUrl?: string | null;
}

export async function create(input: CreateApplicationInput): Promise<TeacherApplicationRow> {
  return prisma.teacherApplication.create({
    data: { ...input, status: 'pending' },
    include: applicationInclude,
  });
}

export async function updateReview(
  id: string,
  data: {
    status: ApplicationStatus;
    reviewedById: string;
    feedback?: string | null;
  },
  tx?: Prisma.TransactionClient,
): Promise<TeacherApplicationRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.teacherApplication.update({
    where: { id },
    data: {
      status: data.status,
      reviewedById: data.reviewedById,
      reviewedAt: new Date(),
      feedback: data.feedback ?? null,
    },
    include: applicationInclude,
  });
}
