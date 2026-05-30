/**
 * Teacher Application Service
 * ---------------------------
 * Foydalanuvchi o'qituvchi bo'lishga ariza beradi.
 * Admin tasdiqlasa, user role → 'teacher'.
 *
 * Qoidalar:
 *   - Bitta user faqat 1 ta active (pending/under_review) ariza bo'la oladi
 *   - Allaqachon teacher/admin → ariza yarata olmaydi
 *   - Approved'dan keyin yana ariza yarata olmaydi
 *   - Rejected'dan keyin yangi ariza yarata oladi
 */

import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  teacherApplicationRepo,
  userRepo,
  type TeacherApplicationRow,
  type AdminApplicationsFilters,
  type CreateApplicationInput,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { log as auditLog } from './audit-log.service';

export class ApplicationNotFoundError extends Error {
  code = 'APPLICATION_NOT_FOUND';
  constructor(id: string) {
    super(`Application not found: ${id}`);
    this.name = 'ApplicationNotFoundError';
  }
}

export class ApplicationAlreadyExistsError extends Error {
  code = 'APPLICATION_ALREADY_EXISTS';
  constructor() {
    super("Siz allaqachon ariza topshirgansiz. Admin javobini kuting.");
    this.name = 'ApplicationAlreadyExistsError';
  }
}

export class AlreadyTeacherError extends Error {
  code = 'ALREADY_TEACHER';
  constructor() {
    super("Siz allaqachon o'qituvchisiz");
    this.name = 'AlreadyTeacherError';
  }
}

export interface ListApplicationsResult {
  applications: TeacherApplicationRow[];
  total: number;
  nextCursor: string | null;
  stats: Awaited<ReturnType<typeof teacherApplicationRepo.statusCountsForAdmin>>;
}

export async function listApplications(
  filters: AdminApplicationsFilters = {},
): Promise<ListApplicationsResult> {
  const limit = filters.limit ?? 20;
  const [rows, total, stats] = await Promise.all([
    teacherApplicationRepo.findAllForAdmin({ ...filters, limit }),
    teacherApplicationRepo.countForAdmin(filters),
    teacherApplicationRepo.statusCountsForAdmin(),
  ]);
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    applications: items,
    total,
    nextCursor: hasMore ? items[items.length - 1].id : null,
    stats,
  };
}

export async function getActiveApplication(userId: string): Promise<TeacherApplicationRow | null> {
  return teacherApplicationRepo.findActiveByUser(userId);
}

interface ApplyInput {
  fullName: string;
  email: string;
  phone?: string;
  expertise: string;
  bio: string;
  motivation: string;
  experience?: string;
  sampleUrl?: string;
}

function validateApplyInput(input: ApplyInput): CreateApplicationInput {
  const trim = (s: string) => s.trim();
  const fullName = trim(input.fullName);
  const email = trim(input.email);
  const expertise = trim(input.expertise);
  const bio = trim(input.bio);
  const motivation = trim(input.motivation);

  if (fullName.length < 2) throw new ValidationError("Ism kamida 2 belgi");
  if (!/.+@.+\..+/.test(email)) throw new ValidationError("Email noto'g'ri");
  if (expertise.length < 3) throw new ValidationError("Mutaxassislik soha kamida 3 belgi");
  if (bio.length < 30) throw new ValidationError("Bio kamida 30 belgi bo'lishi kerak");
  if (motivation.length < 30) throw new ValidationError("Motivatsiya kamida 30 belgi");

  return {
    userId: '', // caller'da to'ldiriladi
    fullName,
    email,
    phone: input.phone?.trim() || null,
    expertise,
    bio,
    motivation,
    experience: input.experience?.trim() || null,
    sampleUrl: input.sampleUrl?.trim() || null,
  };
}

export async function submitApplication(
  userId: string,
  input: ApplyInput,
): Promise<TeacherApplicationRow> {
  // 1) Joriy rolni tekshirish
  const user = await userRepo.findById(userId);
  if (!user) throw new ValidationError("Foydalanuvchi topilmadi");
  if (user.role === 'teacher' || user.role === 'admin') {
    throw new AlreadyTeacherError();
  }

  // 2) Aktiv ariza bormi
  const existing = await teacherApplicationRepo.findActiveByUser(userId);
  if (existing) throw new ApplicationAlreadyExistsError();

  // 3) Yaratish
  const validated = validateApplyInput(input);
  return teacherApplicationRepo.create({ ...validated, userId });
}

export async function approveApplication(
  adminId: string,
  applicationId: string,
  feedback: string | undefined,
  request?: NextRequest,
): Promise<TeacherApplicationRow> {
  const target = await teacherApplicationRepo.findById(applicationId);
  if (!target) throw new ApplicationNotFoundError(applicationId);
  if (target.status === 'approved') return target; // idempotent

  return prisma.$transaction(async (tx) => {
    // 1) Application status → approved
    const updated = await teacherApplicationRepo.updateReview(
      applicationId,
      { status: 'approved', reviewedById: adminId, feedback: feedback ?? null },
      tx,
    );

    // 2) User role → teacher (UserProfile + User ikkalasini ham)
    await tx.user.update({
      where: { id: target.userId },
      data: { role: 'teacher' },
    });
    await tx.userProfile.update({
      where: { id: target.userId },
      data: { role: 'teacher' },
    });

    // 3) Audit log
    await auditLog(
      {
        adminId,
        action: 'teacher_application.approve',
        targetType: 'teacher_application',
        targetId: applicationId,
        metadata: {
          userId: target.userId,
          previousRole: target.user.role,
          feedback: feedback ?? null,
        },
        request,
      },
      tx,
    );

    return updated;
  });
}

export async function rejectApplication(
  adminId: string,
  applicationId: string,
  feedback: string,
  request?: NextRequest,
): Promise<TeacherApplicationRow> {
  if (!feedback || feedback.trim().length < 5) {
    throw new ValidationError("Rad etish uchun sabab kerak (kamida 5 belgi)");
  }
  const target = await teacherApplicationRepo.findById(applicationId);
  if (!target) throw new ApplicationNotFoundError(applicationId);
  if (target.status === 'rejected') return target;

  return prisma.$transaction(async (tx) => {
    const updated = await teacherApplicationRepo.updateReview(
      applicationId,
      { status: 'rejected', reviewedById: adminId, feedback },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'teacher_application.reject',
        targetType: 'teacher_application',
        targetId: applicationId,
        metadata: {
          userId: target.userId,
          feedback,
          previousStatus: target.status,
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
  applicationId: string,
  request?: NextRequest,
): Promise<TeacherApplicationRow> {
  const target = await teacherApplicationRepo.findById(applicationId);
  if (!target) throw new ApplicationNotFoundError(applicationId);
  if (target.status !== 'pending') return target;

  return prisma.$transaction(async (tx) => {
    const updated = await teacherApplicationRepo.updateReview(
      applicationId,
      { status: 'under_review', reviewedById: adminId },
      tx,
    );
    await auditLog(
      {
        adminId,
        action: 'teacher_application.start_review',
        targetType: 'teacher_application',
        targetId: applicationId,
        metadata: { userId: target.userId },
        request,
      },
      tx,
    );
    return updated;
  });
}

export type ReviewActionPayload =
  | { action: 'start_review' }
  | { action: 'approve'; feedback?: string }
  | { action: 'reject'; feedback: string };

export async function applyReviewAction(
  adminId: string,
  applicationId: string,
  payload: ReviewActionPayload,
  request?: NextRequest,
): Promise<TeacherApplicationRow> {
  switch (payload.action) {
    case 'start_review':
      return startReview(adminId, applicationId, request);
    case 'approve':
      return approveApplication(adminId, applicationId, payload.feedback, request);
    case 'reject':
      return rejectApplication(adminId, applicationId, payload.feedback, request);
    default: {
      const exhaustive: never = payload;
      throw new ValidationError(`Noma'lum amal: ${JSON.stringify(exhaustive)}`);
    }
  }
}
