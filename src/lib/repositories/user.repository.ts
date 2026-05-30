/**
 * User repository — `user_profiles` jadvali uchun admin query'lari.
 * Biznes logikasi YO'Q. Faqat Prisma query'lar.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma, UserRole } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  deletedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
};

export interface ListUsersOptions {
  role?: UserRole | 'all';
  search?: string;
  limit?: number;
  cursor?: string | null;
  includeInactive?: boolean;
}

const adminUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  deletedAt: true,
  lastLoginAt: true,
  createdAt: true,
} satisfies Prisma.UserProfileSelect;

/**
 * Foydalanuvchilar ro'yxati — admin panel uchun.
 * Cursor pagination: oxirgi user.id'ni `cursor` parametriga uzating.
 */
export async function findManyForAdmin(
  options: ListUsersOptions = {},
): Promise<AdminUserRow[]> {
  const { role, search, limit = 20, cursor, includeInactive = true } = options;

  const where: Prisma.UserProfileWhereInput = {
    ...(role && role !== 'all' ? { role } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { fullName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(!includeInactive ? { isActive: true, deletedAt: null } : {}),
  };

  return prisma.userProfile.findMany({
    where,
    select: adminUserSelect,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // +1 — `hasMore` aniqlash uchun
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function countForAdmin(
  filters: Pick<ListUsersOptions, 'role' | 'search' | 'includeInactive'> = {},
): Promise<number> {
  const { role, search, includeInactive = true } = filters;
  return prisma.userProfile.count({
    where: {
      ...(role && role !== 'all' ? { role } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(!includeInactive ? { isActive: true, deletedAt: null } : {}),
    },
  });
}

export async function findById(userId: string): Promise<AdminUserRow | null> {
  return prisma.userProfile.findUnique({
    where: { id: userId },
    select: adminUserSelect,
  });
}

export async function updateActiveStatus(
  userId: string,
  isActive: boolean,
  tx?: Prisma.TransactionClient,
): Promise<AdminUserRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.userProfile.update({
    where: { id: userId },
    data: { isActive, deletedAt: isActive ? null : new Date() },
    select: adminUserSelect,
  });
}

export async function updateRole(
  userId: string,
  role: UserRole,
  tx?: Prisma.TransactionClient,
): Promise<AdminUserRow> {
  const client: PrismaLike = tx ?? prisma;
  // UserProfile.role va User.role ikkalasi ham yangilanadi (bir transaction'da)
  await client.user.update({
    where: { id: userId },
    data: { role },
  });
  return client.userProfile.update({
    where: { id: userId },
    data: { role },
    select: adminUserSelect,
  });
}

export async function countByRole(): Promise<{
  total: number;
  student: number;
  teacher: number;
  admin: number;
}> {
  const grouped = await prisma.userProfile.groupBy({
    by: ['role'],
    where: { deletedAt: null },
    _count: { _all: true },
  });

  const counts = { total: 0, student: 0, teacher: 0, admin: 0 };
  for (const row of grouped) {
    counts[row.role] = row._count._all;
    counts.total += row._count._all;
  }
  return counts;
}

export async function countActiveAdmins(
  tx?: Prisma.TransactionClient,
): Promise<number> {
  const client: PrismaLike = tx ?? prisma;
  return client.userProfile.count({
    where: { role: 'admin', isActive: true, deletedAt: null },
  });
}

export async function countNewSince(date: Date): Promise<number> {
  return prisma.userProfile.count({
    where: { createdAt: { gte: date } },
  });
}

export async function touchLastLogin(userId: string): Promise<void> {
  await prisma.userProfile.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}
