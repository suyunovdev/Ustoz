/**
 * Audit log service — admin amallarini log qiladi.
 *
 * Foydalanish:
 *   await auditLogService.log({
 *     adminId: session.sub,
 *     action: 'user.suspend',
 *     targetType: 'user',
 *     targetId: userId,
 *     metadata: { reason },
 *     request: req,
 *   });
 */

import type { NextRequest } from 'next/server';
import type { Prisma } from '@/generated/prisma/client';
import { auditLogRepo } from '@/lib/repositories';
import { getClientIp, getUserAgent } from '@/lib/auth-helpers';

export const AUDIT_ACTIONS = {
  USER_SUSPEND: 'user.suspend',
  USER_ACTIVATE: 'user.activate',
  USER_ROLE_CHANGE: 'user.role_change',
  COURSE_APPROVE: 'course.approve',
  COURSE_REJECT: 'course.reject',
  MATERIAL_APPROVE: 'material.approve',
  MATERIAL_REJECT: 'material.reject',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface LogInput {
  adminId: string;
  action: AuditAction | string;
  targetType: 'user' | 'course' | 'material' | string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}

export async function log(input: LogInput, tx?: Prisma.TransactionClient): Promise<void> {
  await auditLogRepo.create(
    {
      adminId: input.adminId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      metadata: (input.metadata ?? null) as Prisma.InputJsonValue,
      ipAddress: input.request ? getClientIp(input.request) : null,
      userAgent: input.request ? getUserAgent(input.request) : null,
    },
    tx,
  );
}

export async function getRecentActions(filters?: {
  adminId?: string;
  targetType?: string;
  action?: string;
  search?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  cursor?: string | null;
}) {
  const limit = filters?.limit ?? 50;
  const [rows, total] = await Promise.all([
    auditLogRepo.findRecent({ ...filters, limit }),
    auditLogRepo.countForAdmin(filters),
  ]);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    logs: items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

export async function getTargetHistory(targetType: string, targetId: string, limit = 50) {
  return auditLogRepo.findByTarget(targetType, targetId, limit);
}

export async function getDistinctActions() {
  return auditLogRepo.distinctActions();
}

export async function getDistinctTargetTypes() {
  return auditLogRepo.distinctTargetTypes();
}
