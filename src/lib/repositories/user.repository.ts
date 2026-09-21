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

export type UserSortField = 'createdAt' | 'lastLoginAt' | 'fullName' | 'email' | 'role';

const USER_SORT_FIELDS: Record<UserSortField, keyof Prisma.UserProfileOrderByWithRelationInput> = {
  createdAt: 'createdAt',
  lastLoginAt: 'lastLoginAt',
  fullName: 'fullName',
  email: 'email',
  role: 'role',
};

export interface ListUsersOptions {
  role?: UserRole | 'all';
  search?: string;
  limit?: number;
  /** Offset (sahifa raqamli) pagination — (page-1)*limit. */
  offset?: number;
  sort?: UserSortField;
  order?: 'asc' | 'desc';
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
 * Offset pagination + ustun-sort. `id` ikkilamchi tartib (barqaror sahifalash).
 */
export async function findManyForAdmin(
  options: ListUsersOptions = {},
): Promise<AdminUserRow[]> {
  const {
    role,
    search,
    limit = 20,
    offset = 0,
    sort = 'createdAt',
    order = 'desc',
    includeInactive = true,
  } = options;

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

  const sortField = USER_SORT_FIELDS[sort] ?? 'createdAt';

  return prisma.userProfile.findMany({
    where,
    select: adminUserSelect,
    orderBy: [{ [sortField]: order } as Prisma.UserProfileOrderByWithRelationInput, { id: 'asc' }],
    take: limit,
    skip: offset,
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

export type AdminUserDetailRow = AdminUserRow & {
  bio: string | null;
  phone: string | null;
  referralCode: string | null;
  headline: string | null;
  // Payout — RAW; servis maskalaydi (oxirgi 4 raqam). Route hech qachon xom qaytarmaydi.
  payoutBankName: string | null;
  payoutRecipientName: string | null;
  payoutCardNumber: string | null;
  payoutAccountNumber: string | null;
};

/** Bitta foydalanuvchi bo'yicha boyroq profil — admin detail sahifasi uchun. */
export async function findDetailForAdmin(userId: string): Promise<AdminUserDetailRow | null> {
  return prisma.userProfile.findUnique({
    where: { id: userId },
    select: {
      ...adminUserSelect,
      bio: true,
      phone: true,
      referralCode: true,
      headline: true,
      payoutBankName: true,
      payoutRecipientName: true,
      payoutCardNumber: true,
      payoutAccountNumber: true,
    },
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
