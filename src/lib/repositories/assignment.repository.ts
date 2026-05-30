/**
 * Assignment repository — `assignments`, `assignment_submissions`.
 *
 * Assignment status: 'draft' | 'published' | 'archived'
 * Submission status: 'submitted' | 'graded' | 'returned' | 'late'
 * Submission type: 'text' | 'file' | 'url' | 'any'
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';

export type AssignmentStatus = 'draft' | 'published' | 'archived';
export type SubmissionStatus = 'submitted' | 'graded' | 'returned' | 'late';
export type SubmissionType = 'text' | 'file' | 'url' | 'any';

export interface AttachmentJSON {
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface AssignmentRow {
  id: string;
  courseId: string;
  teacherId: string;
  topicId: string | null;
  title: string;
  description: string | null;
  instructions: string | null;
  dueDate: Date;
  maxScore: number;
  fileRequirements: string | null;
  submissionType: string;
  status: string;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  submissionCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubmissionRow {
  id: string;
  studentId: string;
  courseId: string;
  assignmentId: string;
  submissionUrl: string | null;
  submissionText: string | null;
  attachments: any;
  status: string;
  isLate: boolean;
  revisionNumber: number;
  submittedAt: Date;
  updatedAt: Date;
  grade: number | null;
  feedback: string | null;
  gradedAt: Date | null;
  gradedBy: string | null;
}

// ==================== ASSIGNMENT CRUD ====================

export interface CreateAssignmentInput {
  courseId: string;
  teacherId: string;
  topicId?: string | null;
  title: string;
  description?: string | null;
  instructions?: string | null;
  dueDate: Date;
  maxScore?: number;
  fileRequirements?: string | null;
  submissionType?: SubmissionType;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
}

export async function createAssignment(
  input: CreateAssignmentInput,
): Promise<AssignmentRow> {
  return prisma.assignment.create({
    data: {
      courseId: input.courseId,
      teacherId: input.teacherId,
      topicId: input.topicId ?? null,
      title: input.title,
      description: input.description ?? null,
      instructions: input.instructions ?? null,
      dueDate: input.dueDate,
      maxScore: input.maxScore ?? 100,
      fileRequirements: input.fileRequirements ?? null,
      submissionType: input.submissionType ?? 'any',
      allowLateSubmission: input.allowLateSubmission ?? false,
      latePenaltyPercent: input.latePenaltyPercent ?? 0,
      status: 'draft',
    },
  });
}

export async function findAssignmentById(id: string): Promise<AssignmentRow | null> {
  return prisma.assignment.findUnique({ where: { id } });
}

export async function findAssignmentWithCourse(id: string) {
  return prisma.assignment.findUnique({
    where: { id },
    include: { course: { select: { id: true, title: true, teacherId: true } } },
  });
}

export interface ListAssignmentsFilters {
  teacherId?: string;
  courseId?: string;
  topicId?: string;
  status?: AssignmentStatus;
}

export async function listAssignments(
  filters: ListAssignmentsFilters = {},
): Promise<
  Array<
    AssignmentRow & {
      courseTitle: string;
      submissionCount: number;
      gradedCount: number;
    }
  >
> {
  const where: Prisma.AssignmentWhereInput = {};
  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.topicId) where.topicId = filters.topicId;
  if (filters.status) where.status = filters.status;

  const rows = await prisma.assignment.findMany({
    where,
    include: {
      course: { select: { title: true } },
      _count: { select: { submissions: true } },
      submissions: { where: { status: 'graded' }, select: { id: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  return rows.map((r) => ({
    id: r.id,
    courseId: r.courseId,
    teacherId: r.teacherId,
    topicId: r.topicId,
    title: r.title,
    description: r.description,
    instructions: r.instructions,
    dueDate: r.dueDate,
    maxScore: r.maxScore,
    fileRequirements: r.fileRequirements,
    submissionType: r.submissionType,
    status: r.status,
    allowLateSubmission: r.allowLateSubmission,
    latePenaltyPercent: r.latePenaltyPercent,
    submissionCount: r._count.submissions,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    courseTitle: r.course.title,
    gradedCount: r.submissions.length,
  }));
}

export interface UpdateAssignmentInput {
  title?: string;
  description?: string | null;
  instructions?: string | null;
  dueDate?: Date;
  maxScore?: number;
  fileRequirements?: string | null;
  submissionType?: SubmissionType;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
  status?: AssignmentStatus;
  topicId?: string | null;
}

export async function updateAssignment(
  id: string,
  data: UpdateAssignmentInput,
): Promise<AssignmentRow> {
  return prisma.assignment.update({ where: { id }, data });
}

export async function deleteAssignment(id: string): Promise<void> {
  await prisma.assignment.delete({ where: { id } });
}

export async function isAssignmentOwner(
  assignmentId: string,
  teacherId: string,
): Promise<{ ok: boolean; courseId: string | null }> {
  const a = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { teacherId: true, courseId: true },
  });
  if (!a) return { ok: false, courseId: null };
  return { ok: a.teacherId === teacherId, courseId: a.courseId };
}

// ==================== SUBMISSIONS ====================

export interface CreateSubmissionInput {
  assignmentId: string;
  studentId: string;
  courseId: string;
  submissionText?: string | null;
  submissionUrl?: string | null;
  attachments?: AttachmentJSON[];
  isLate: boolean;
}

/**
 * Upsert — talaba qayta topshirsa, revision_number oshadi.
 */
export async function upsertSubmission(
  input: CreateSubmissionInput,
): Promise<SubmissionRow> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.assignmentSubmission.findFirst({
      where: { assignmentId: input.assignmentId, studentId: input.studentId },
      orderBy: { revisionNumber: 'desc' },
    });

    if (existing && existing.status !== 'graded') {
      // Yangilash (resubmit)
      return tx.assignmentSubmission.update({
        where: { id: existing.id },
        data: {
          submissionText: input.submissionText ?? null,
          submissionUrl: input.submissionUrl ?? null,
          attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue,
          isLate: input.isLate,
          status: input.isLate ? 'late' : 'submitted',
          revisionNumber: existing.revisionNumber + 1,
          submittedAt: new Date(),
        },
      });
    }

    if (existing && existing.status === 'graded') {
      // Yangi revision sifatida yaratish
      const newRev = existing.revisionNumber + 1;
      const created = await tx.assignmentSubmission.create({
        data: {
          assignmentId: input.assignmentId,
          studentId: input.studentId,
          courseId: input.courseId,
          submissionText: input.submissionText ?? null,
          submissionUrl: input.submissionUrl ?? null,
          attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue,
          isLate: input.isLate,
          status: input.isLate ? 'late' : 'submitted',
          revisionNumber: newRev,
        },
      });
      await tx.assignment.update({
        where: { id: input.assignmentId },
        data: { submissionCount: { increment: 1 } },
      });
      return created;
    }

    // Hech qanday submission yo'q — yangi yaratish
    const created = await tx.assignmentSubmission.create({
      data: {
        assignmentId: input.assignmentId,
        studentId: input.studentId,
        courseId: input.courseId,
        submissionText: input.submissionText ?? null,
        submissionUrl: input.submissionUrl ?? null,
        attachments: (input.attachments ?? []) as unknown as Prisma.InputJsonValue,
        isLate: input.isLate,
        status: input.isLate ? 'late' : 'submitted',
      },
    });
    await tx.assignment.update({
      where: { id: input.assignmentId },
      data: { submissionCount: { increment: 1 } },
    });
    return created;
  });
}

export async function findSubmissionById(id: string): Promise<SubmissionRow | null> {
  return prisma.assignmentSubmission.findUnique({ where: { id } });
}

export async function findStudentSubmission(
  assignmentId: string,
  studentId: string,
): Promise<SubmissionRow | null> {
  return prisma.assignmentSubmission.findFirst({
    where: { assignmentId, studentId },
    orderBy: { revisionNumber: 'desc' },
  });
}

export async function listAssignmentSubmissions(
  assignmentId: string,
  filters: { status?: SubmissionStatus } = {},
): Promise<
  Array<SubmissionRow & { studentName: string; studentEmail: string }>
> {
  const where: Prisma.AssignmentSubmissionWhereInput = { assignmentId };
  if (filters.status) where.status = filters.status;

  const rows = await prisma.assignmentSubmission.findMany({
    where,
    include: { student: { select: { fullName: true, email: true } } },
    orderBy: { submittedAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    courseId: r.courseId,
    assignmentId: r.assignmentId,
    submissionUrl: r.submissionUrl,
    submissionText: r.submissionText,
    attachments: r.attachments,
    status: r.status,
    isLate: r.isLate,
    revisionNumber: r.revisionNumber,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
    grade: r.grade,
    feedback: r.feedback,
    gradedAt: r.gradedAt,
    gradedBy: r.gradedBy,
    studentName: r.student.fullName,
    studentEmail: r.student.email,
  }));
}

export async function listStudentSubmissions(
  studentId: string,
): Promise<
  Array<
    SubmissionRow & {
      assignmentTitle: string;
      courseTitle: string;
      dueDate: Date;
      maxScore: number;
    }
  >
> {
  const rows = await prisma.assignmentSubmission.findMany({
    where: { studentId },
    include: {
      assignment: {
        select: {
          title: true,
          dueDate: true,
          maxScore: true,
          course: { select: { title: true } },
        },
      },
    },
    orderBy: { submittedAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    studentId: r.studentId,
    courseId: r.courseId,
    assignmentId: r.assignmentId,
    submissionUrl: r.submissionUrl,
    submissionText: r.submissionText,
    attachments: r.attachments,
    status: r.status,
    isLate: r.isLate,
    revisionNumber: r.revisionNumber,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
    grade: r.grade,
    feedback: r.feedback,
    gradedAt: r.gradedAt,
    gradedBy: r.gradedBy,
    assignmentTitle: r.assignment.title,
    courseTitle: r.assignment.course.title,
    dueDate: r.assignment.dueDate,
    maxScore: r.assignment.maxScore,
  }));
}

export interface GradeSubmissionInput {
  grade: number;
  feedback?: string | null;
  graderId: string;
}

export async function gradeSubmission(
  submissionId: string,
  input: GradeSubmissionInput,
): Promise<SubmissionRow> {
  return prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      grade: input.grade,
      feedback: input.feedback ?? null,
      gradedAt: new Date(),
      gradedBy: input.graderId,
      status: 'graded',
    },
  });
}

/**
 * Talabaga qaytarish (revision so'rash).
 */
export async function returnSubmission(
  submissionId: string,
  feedback: string,
  graderId: string,
): Promise<SubmissionRow> {
  return prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      status: 'returned',
      feedback,
      gradedAt: new Date(),
      gradedBy: graderId,
    },
  });
}
