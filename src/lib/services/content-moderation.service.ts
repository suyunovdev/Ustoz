/**
 * Content Moderation Service
 * --------------------------
 * Course material'larni admin tomonidan ko'rib chiqish.
 *
 * Flow:
 *   draft → submitted → under_review → approved / rejected / revision_requested
 *
 * Har action:
 *   - moderation_queue.status yangilanadi
 *   - course_materials.moderation_status sinxron
 *   - moderation_history'ga qator qo'shiladi (audit trail)
 *   - audit_logs (admin actions journal)
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ModerationStatus } from '@/generated/prisma/client';
import {
  moderationRepo,
  type ModerationQueueRow,
  type ModerationQueueFilters,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { log as auditLog } from './audit-log.service';

export class QueueItemNotFoundError extends Error {
  code = 'QUEUE_ITEM_NOT_FOUND';
  constructor(id: string) {
    super(`Queue item not found: ${id}`);
    this.name = 'QueueItemNotFoundError';
  }
}

export interface ListQueueResult {
  items: ModerationQueueRow[];
  total: number;
  nextCursor: string | null;
  stats: Awaited<ReturnType<typeof moderationRepo.statusCounts>>;
}

export async function listQueue(
  filters: ModerationQueueFilters = {},
): Promise<ListQueueResult> {
  const limit = filters.limit ?? 20;
  const [rows, total, stats] = await Promise.all([
    moderationRepo.findQueueForAdmin({ ...filters, limit }),
    moderationRepo.countForAdmin(filters),
    moderationRepo.statusCounts(),
  ]);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    stats,
  };
}

export async function getMaterialHistory(materialId: string) {
  return moderationRepo.getMaterialHistory(materialId);
}

async function applyStatusChange(
  adminId: string,
  queueId: string,
  newStatus: ModerationStatus,
  feedback: string | null,
  request: NextRequest | undefined,
  auditAction: string,
): Promise<ModerationQueueRow> {
  const target = await moderationRepo.findById(queueId);
  if (!target) throw new QueueItemNotFoundError(queueId);

  return prisma.$transaction(async (tx) => {
    const updated = await moderationRepo.updateStatus(
      queueId,
      { status: newStatus, reviewerId: adminId, feedback },
      tx,
    );
    await moderationRepo.updateMaterialStatus(target.materialId, newStatus, tx);
    await moderationRepo.appendHistory(
      {
        materialId: target.materialId,
        reviewerId: adminId,
        action: auditAction,
        status: newStatus,
        feedback,
      },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: auditAction,
        targetType: 'material',
        targetId: target.materialId,
        metadata: {
          queueId,
          previousStatus: target.status,
          newStatus,
          feedback,
        },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function startReview(
  adminId: string,
  queueId: string,
  request?: NextRequest,
): Promise<ModerationQueueRow> {
  return applyStatusChange(
    adminId,
    queueId,
    'under_review',
    null,
    request,
    'material.start_review',
  );
}

export async function approveMaterial(
  adminId: string,
  queueId: string,
  feedback: string | undefined,
  request?: NextRequest,
): Promise<ModerationQueueRow> {
  return applyStatusChange(
    adminId,
    queueId,
    'approved',
    feedback ?? null,
    request,
    'material.approve',
  );
}

export async function rejectMaterial(
  adminId: string,
  queueId: string,
  feedback: string,
  request?: NextRequest,
): Promise<ModerationQueueRow> {
  if (!feedback || feedback.trim().length < 5) {
    throw new ValidationError("Rad etish sababi kerak (kamida 5 belgi)");
  }
  return applyStatusChange(
    adminId,
    queueId,
    'rejected',
    feedback,
    request,
    'material.reject',
  );
}

export async function requestRevision(
  adminId: string,
  queueId: string,
  feedback: string,
  request?: NextRequest,
): Promise<ModerationQueueRow> {
  if (!feedback || feedback.trim().length < 5) {
    throw new ValidationError("Revision sababi kerak (kamida 5 belgi)");
  }
  return applyStatusChange(
    adminId,
    queueId,
    'revision_requested',
    feedback,
    request,
    'material.request_revision',
  );
}

export type MaterialActionPayload =
  | { action: 'start_review' }
  | { action: 'approve'; feedback?: string }
  | { action: 'reject'; feedback: string }
  | { action: 'request_revision'; feedback: string };

export async function applyAction(
  adminId: string,
  queueId: string,
  payload: MaterialActionPayload,
  request?: NextRequest,
): Promise<ModerationQueueRow> {
  switch (payload.action) {
    case 'start_review':
      return startReview(adminId, queueId, request);
    case 'approve':
      return approveMaterial(adminId, queueId, payload.feedback, request);
    case 'reject':
      return rejectMaterial(adminId, queueId, payload.feedback, request);
    case 'request_revision':
      return requestRevision(adminId, queueId, payload.feedback, request);
    default: {
      const exhaustive: never = payload;
      throw new ValidationError(`Noma'lum amal: ${JSON.stringify(exhaustive)}`);
    }
  }
}
