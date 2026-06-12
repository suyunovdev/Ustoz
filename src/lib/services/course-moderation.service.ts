/**
 * Course Moderation Service
 * -------------------------
 * Admin uchun kurslarni boshqarish: list / approve / reject / feature / suspend.
 *
 * Har action audit log'ga yoziladi.
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { ModerationStatus } from '@/generated/prisma/client';
import {
  courseRepo,
  type CourseWithAdminInfo,
  type AdminCourseFilters,
} from '@/lib/repositories';
import {
  CourseNotFoundError,
  ValidationError,
} from '@/lib/errors';
import { log as auditLog } from './audit-log.service';

const VALID_STATUSES: ReadonlyArray<ModerationStatus> = [
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'revision_requested',
];

// State machine: qaysi statusdan qaysi target statusga o'tish ruxsat etiladi.
// approve/reject/request_revision faqat "tekshirishga jo'natilgan" yoki
// "qayta ko'rib chiqishga qaytarilgan" kurslarga qo'llaniladi.
const REVIEWABLE_STATUSES: ReadonlyArray<ModerationStatus> = [
  'submitted',
  'under_review',
  'revision_requested',
];

export class InvalidStatusTransitionError extends Error {
  code = 'INVALID_STATUS_TRANSITION';
  constructor(current: string, target: string) {
    super(`Status o'tishi noto'g'ri: "${current}" -> "${target}"`);
    this.name = 'InvalidStatusTransitionError';
  }
}

export interface ListCoursesResult {
  courses: CourseWithAdminInfo[];
  total: number;
  nextCursor: string | null;
  stats: Awaited<ReturnType<typeof courseRepo.statusCountsForAdmin>>;
}

export async function listCourses(
  filters: AdminCourseFilters = {},
): Promise<ListCoursesResult> {
  const limit = filters.limit ?? 20;
  const [rows, total, stats] = await Promise.all([
    courseRepo.findAllForAdmin({ ...filters, limit }),
    courseRepo.countForAdmin({
      status: filters.status,
      search: filters.search,
      featuredOnly: filters.featuredOnly,
      suspendedOnly: filters.suspendedOnly,
    }),
    courseRepo.statusCountsForAdmin(),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    courses: items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    stats,
  };
}

export async function approveCourse(
  adminId: string,
  courseId: string,
  feedback: string | undefined,
  request?: NextRequest,
): Promise<CourseWithAdminInfo> {
  const target = await courseRepo.findByIdForAdmin(courseId);
  if (!target) throw new CourseNotFoundError(courseId);

  // Idempotent: allaqachon approved bo'lsa, audit log yozmasdan qaytaramiz
  if (target.moderationStatus === 'approved') return target;

  // State machine: faqat reviewable statuslardan approved'ga o'tish mumkin
  if (!REVIEWABLE_STATUSES.includes(target.moderationStatus)) {
    throw new InvalidStatusTransitionError(target.moderationStatus, 'approved');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await courseRepo.updateModerationStatus(
      courseId,
      {
        status: 'approved',
        feedback: feedback ?? null,
        reviewedById: adminId,
        publishOnApproval: true,
      },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'course.approve',
        targetType: 'course',
        targetId: courseId,
        metadata: {
          previousStatus: target.moderationStatus,
          feedback: feedback ?? null,
        },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function rejectCourse(
  adminId: string,
  courseId: string,
  feedback: string,
  request?: NextRequest,
): Promise<CourseWithAdminInfo> {
  if (!feedback || feedback.trim().length < 5) {
    throw new ValidationError("Rad etish uchun sabab kerak (kamida 5 belgi)");
  }
  const target = await courseRepo.findByIdForAdmin(courseId);
  if (!target) throw new CourseNotFoundError(courseId);

  // Idempotent: allaqachon rejected
  if (target.moderationStatus === 'rejected') return target;

  // State machine: reject faqat reviewable yoki approved (post-publish moderation) holatdan
  const allowedFrom: ReadonlyArray<ModerationStatus> = [...REVIEWABLE_STATUSES, 'approved'];
  if (!allowedFrom.includes(target.moderationStatus)) {
    throw new InvalidStatusTransitionError(target.moderationStatus, 'rejected');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await courseRepo.updateModerationStatus(
      courseId,
      {
        status: 'rejected',
        feedback,
        reviewedById: adminId,
      },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'course.reject',
        targetType: 'course',
        targetId: courseId,
        metadata: { previousStatus: target.moderationStatus, feedback },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function requestRevision(
  adminId: string,
  courseId: string,
  feedback: string,
  request?: NextRequest,
): Promise<CourseWithAdminInfo> {
  if (!feedback || feedback.trim().length < 5) {
    throw new ValidationError("Revision uchun izoh kerak (kamida 5 belgi)");
  }
  const target = await courseRepo.findByIdForAdmin(courseId);
  if (!target) throw new CourseNotFoundError(courseId);

  // Idempotent
  if (target.moderationStatus === 'revision_requested') return target;

  // State machine: revision faqat submitted/under_review dan
  const allowedFrom: ReadonlyArray<ModerationStatus> = ['submitted', 'under_review'];
  if (!allowedFrom.includes(target.moderationStatus)) {
    throw new InvalidStatusTransitionError(target.moderationStatus, 'revision_requested');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await courseRepo.updateModerationStatus(
      courseId,
      {
        status: 'revision_requested',
        feedback,
        reviewedById: adminId,
      },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'course.revision_requested',
        targetType: 'course',
        targetId: courseId,
        metadata: { previousStatus: target.moderationStatus, feedback },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function toggleFeatured(
  adminId: string,
  courseId: string,
  isFeatured: boolean,
  request?: NextRequest,
): Promise<CourseWithAdminInfo> {
  const target = await courseRepo.findByIdForAdmin(courseId);
  if (!target) throw new CourseNotFoundError(courseId);
  if (target.isFeatured === isFeatured) return target; // idempotent

  return prisma.$transaction(async (tx) => {
    const updated = await courseRepo.setFeatured(courseId, isFeatured, tx);
    await auditLog(
      {
        adminId,
        action: isFeatured ? 'course.featured' : 'course.unfeatured',
        targetType: 'course',
        targetId: courseId,
        metadata: { previousIsFeatured: target.isFeatured },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function suspendCourse(
  adminId: string,
  courseId: string,
  reason: string,
  request?: NextRequest,
): Promise<CourseWithAdminInfo> {
  if (!reason || reason.trim().length < 5) {
    throw new ValidationError("Suspend uchun sabab kerak (kamida 5 belgi)");
  }
  const target = await courseRepo.findByIdForAdmin(courseId);
  if (!target) throw new CourseNotFoundError(courseId);

  return prisma.$transaction(async (tx) => {
    const updated = await courseRepo.setSuspended(
      courseId,
      { suspendedAt: new Date(), reason },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'course.suspend',
        targetType: 'course',
        targetId: courseId,
        metadata: { reason, previousIsPublished: target.isPublished },
        request,
      },
      tx,
    );
    return updated;
  });
}

export async function unsuspendCourse(
  adminId: string,
  courseId: string,
  request?: NextRequest,
): Promise<CourseWithAdminInfo> {
  const target = await courseRepo.findByIdForAdmin(courseId);
  if (!target) throw new CourseNotFoundError(courseId);
  if (target.suspendedAt === null) return target; // idempotent

  return prisma.$transaction(async (tx) => {
    const updated = await courseRepo.setSuspended(
      courseId,
      { suspendedAt: null, reason: null },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'course.unsuspend',
        targetType: 'course',
        targetId: courseId,
        request,
      },
      tx,
    );
    return updated;
  });
}

/** Route handler tarafidan kelgan action'ni dispatch qiladi. */
export type CourseActionPayload =
  | { action: 'approve'; feedback?: string }
  | { action: 'reject'; feedback: string }
  | { action: 'request_revision'; feedback: string }
  | { action: 'feature' }
  | { action: 'unfeature' }
  | { action: 'suspend'; reason: string }
  | { action: 'unsuspend' };

export async function applyAction(
  adminId: string,
  courseId: string,
  payload: CourseActionPayload,
  request?: NextRequest,
): Promise<CourseWithAdminInfo> {
  switch (payload.action) {
    case 'approve':
      return approveCourse(adminId, courseId, payload.feedback, request);
    case 'reject':
      return rejectCourse(adminId, courseId, payload.feedback, request);
    case 'request_revision':
      return requestRevision(adminId, courseId, payload.feedback, request);
    case 'feature':
      return toggleFeatured(adminId, courseId, true, request);
    case 'unfeature':
      return toggleFeatured(adminId, courseId, false, request);
    case 'suspend':
      return suspendCourse(adminId, courseId, payload.reason, request);
    case 'unsuspend':
      return unsuspendCourse(adminId, courseId, request);
    default: {
      const exhaustive: never = payload;
      throw new ValidationError(`Noma'lum amal: ${JSON.stringify(exhaustive)}`);
    }
  }
}

export { VALID_STATUSES };
