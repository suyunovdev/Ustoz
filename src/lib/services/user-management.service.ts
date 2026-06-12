/**
 * User Management Service
 * -----------------------
 * Admin uchun foydalanuvchilarni boshqarish: list / suspend / activate / role change.
 *
 * Xavfsizlik qoidalari:
 *   - Self-action block: admin o'zining hisobini o'zgartira olmaydi
 *   - Last admin block: oxirgi faol admin role'i o'zgartirilmasligi yoki suspend bo'lmasligi kerak
 *   - Har action audit log'ga yoziladi (atomic transaction)
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/generated/prisma/client';
import { userRepo, type AdminUserRow, type ListUsersOptions } from '@/lib/repositories';
import {
  ForbiddenError,
  LastAdminError,
  SelfActionError,
  UserNotFoundError,
  ValidationError,
} from '@/lib/errors';
import { log as auditLog, AUDIT_ACTIONS } from './audit-log.service';

const VALID_ROLES: ReadonlyArray<UserRole> = ['student', 'teacher', 'admin'];

export interface ListUsersResult {
  users: AdminUserRow[];
  total: number;
  nextCursor: string | null;
}

export async function listUsers(filters: ListUsersOptions = {}): Promise<ListUsersResult> {
  const limit = filters.limit ?? 20;
  const rows = await userRepo.findManyForAdmin({ ...filters, limit });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const total = await userRepo.countForAdmin({
    role: filters.role,
    search: filters.search,
    includeInactive: filters.includeInactive,
  });
  return {
    users: items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export async function suspendUser(
  adminId: string,
  userId: string,
  reason: string | undefined,
  request?: NextRequest,
): Promise<AdminUserRow> {
  if (adminId === userId) throw new SelfActionError();

  const target = await userRepo.findById(userId);
  if (!target) throw new UserNotFoundError(userId);
  if (!target.isActive) {
    return target; // idempotent — allaqachon suspended
  }

  return prisma.$transaction(async (tx) => {
    // Oxirgi admin'ni suspend qilib bo'lmaydi
    if (target.role === 'admin') {
      const activeAdmins = await userRepo.countActiveAdmins(tx);
      if (activeAdmins <= 1) throw new LastAdminError();
    }

    const updated = await userRepo.updateActiveStatus(userId, false, tx);
    await auditLog(
      {
        adminId,
        action: AUDIT_ACTIONS.USER_SUSPEND,
        targetType: 'user',
        targetId: userId,
        metadata: { reason: reason ?? null, previousRole: target.role },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function activateUser(
  adminId: string,
  userId: string,
  request?: NextRequest,
): Promise<AdminUserRow> {
  // Self-action himoyasi (suspend/role_change kabi).
  // Admin o'zining account'ini suspend qila olmaydi - shuning uchun u
  // o'zini activate qilish holatiga ham tushmasligi kerak. Bu izchillik
  // uchun va auditda noaniq audit log'larning oldini olish uchun.
  if (adminId === userId) throw new SelfActionError();

  const target = await userRepo.findById(userId);
  if (!target) throw new UserNotFoundError(userId);
  if (target.isActive) {
    return target; // idempotent
  }

  return prisma.$transaction(async (tx) => {
    const updated = await userRepo.updateActiveStatus(userId, true, tx);
    await auditLog(
      {
        adminId,
        action: AUDIT_ACTIONS.USER_ACTIVATE,
        targetType: 'user',
        targetId: userId,
        metadata: { previousRole: target.role },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function changeUserRole(
  adminId: string,
  userId: string,
  newRole: UserRole,
  request?: NextRequest,
): Promise<AdminUserRow> {
  if (adminId === userId) throw new SelfActionError();
  if (!VALID_ROLES.includes(newRole)) {
    throw new ValidationError(`Noto'g'ri rol: ${newRole}`);
  }

  const target = await userRepo.findById(userId);
  if (!target) throw new UserNotFoundError(userId);
  if (target.role === newRole) {
    return target; // idempotent
  }

  return prisma.$transaction(async (tx) => {
    // Oxirgi admin'ni boshqa rolga o'tkazib bo'lmaydi
    if (target.role === 'admin' && newRole !== 'admin') {
      const activeAdmins = await userRepo.countActiveAdmins(tx);
      if (activeAdmins <= 1) throw new LastAdminError();
    }

    const updated = await userRepo.updateRole(userId, newRole, tx);
    await auditLog(
      {
        adminId,
        action: AUDIT_ACTIONS.USER_ROLE_CHANGE,
        targetType: 'user',
        targetId: userId,
        metadata: { fromRole: target.role, toRole: newRole },
        request,
      },
      tx,
    );
    return updated;
  });
}

/** Route handler tarafidan kelgan action'ni dispatch qiladi. */
export type UserActionPayload =
  | { action: 'suspend'; reason?: string }
  | { action: 'activate' }
  | { action: 'change_role'; newRole: UserRole };

export async function applyAction(
  adminId: string,
  userId: string,
  payload: UserActionPayload,
  request?: NextRequest,
): Promise<AdminUserRow> {
  switch (payload.action) {
    case 'suspend':
      return suspendUser(adminId, userId, payload.reason, request);
    case 'activate':
      return activateUser(adminId, userId, request);
    case 'change_role':
      return changeUserRole(adminId, userId, payload.newRole, request);
    default: {
      const exhaustive: never = payload;
      throw new ValidationError(`Noma'lum amal: ${JSON.stringify(exhaustive)}`);
    }
  }
}
