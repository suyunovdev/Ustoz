/**
 * Audit log repository — `audit_logs` jadvali uchun.
 * Admin amallarini log qiladi (suspend, role change, course moderation, ...).
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export interface CreateAuditLogInput {
  adminId: string;
  action: string;             // "user.suspend", "user.activate", "user.role_change", ...
  targetType: string;         // "user" | "course" | "material"
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export type AuditLogRow = {
  id: string;
  adminId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Prisma.JsonValue;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  admin: { id: string; email: string; fullName: string };
};

export async function create(
  input: CreateAuditLogInput,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  await client.auditLog.create({
    data: {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: (input.metadata ?? null) as Prisma.InputJsonValue,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

export interface FindRecentFilters {
  adminId?: string;
  targetType?: string;
  action?: string;
  search?: string;     // metadata yoki ipAddress'da qidirish
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  cursor?: string | null;
}

function buildWhere(filters: FindRecentFilters): Prisma.AuditLogWhereInput {
  const { adminId, targetType, action, fromDate, toDate, search } = filters;
  return {
    ...(adminId ? { adminId } : {}),
    ...(targetType ? { targetType } : {}),
    ...(action ? { action: { contains: action } } : {}),
    ...(fromDate || toDate
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { ipAddress: { contains: search, mode: 'insensitive' } },
            { admin: { email: { contains: search, mode: 'insensitive' } } },
            { admin: { fullName: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export async function findRecent(filters: FindRecentFilters = {}): Promise<AuditLogRow[]> {
  const { limit = 50, cursor } = filters;
  return prisma.auditLog.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: 'desc' },
    take: Math.min(limit, 200) + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      admin: { select: { id: true, email: true, fullName: true } },
    },
  });
}

export async function countForAdmin(filters: FindRecentFilters = {}): Promise<number> {
  return prisma.auditLog.count({ where: buildWhere(filters) });
}

/** Mavjud unique action'lar — UI'da filter dropdown uchun. */
export async function distinctActions(): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({
    select: { action: true },
    distinct: ['action'],
    orderBy: { action: 'asc' },
  });
  return rows.map((r) => r.action);
}

/** Mavjud unique target_type'lar. */
export async function distinctTargetTypes(): Promise<string[]> {
  const rows = await prisma.auditLog.findMany({
    select: { targetType: true },
    distinct: ['targetType'],
    orderBy: { targetType: 'asc' },
  });
  return rows.map((r) => r.targetType);
}

export async function findByTarget(
  targetType: string,
  targetId: string,
  limit = 50,
): Promise<AuditLogRow[]> {
  return prisma.auditLog.findMany({
    where: { targetType, targetId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      admin: { select: { id: true, email: true, fullName: true } },
    },
  });
}
