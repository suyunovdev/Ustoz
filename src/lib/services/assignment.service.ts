/**
 * Assignment Service
 * ------------------
 * Biznes logika:
 *   - Assignment CRUD + ownership check
 *   - Talaba topshirish + deadline + late policy
 *   - Teacher grading + return for revision
 *
 * Late policy:
 *   - allowLateSubmission=false va dueDate o'tgan → submit rad etiladi
 *   - allowLateSubmission=true + dueDate o'tgan → isLate=true, status='late'
 *   - latePenaltyPercent — grading vaqtida teacher tomonidan qo'llaniladi
 */

import {
  assignmentRepo,
  type AssignmentRow,
  type SubmissionRow,
  type AssignmentStatus,
  type SubmissionType,
  type SubmissionStatus,
  type AttachmentJSON,
  type UpdateAssignmentInput,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export class AssignmentNotFoundError extends Error {
  code = 'ASSIGNMENT_NOT_FOUND';
  constructor(id: string) {
    super(`Vazifa topilmadi: ${id}`);
    this.name = 'AssignmentNotFoundError';
  }
}

export class AssignmentAccessDeniedError extends Error {
  code = 'ASSIGNMENT_ACCESS_DENIED';
  constructor() {
    super("Bu vazifa sizniki emas");
    this.name = 'AssignmentAccessDeniedError';
  }
}

export class CourseAccessDeniedError extends Error {
  code = 'COURSE_ACCESS_DENIED';
  constructor() {
    super("Bu kurs sizniki emas");
    this.name = 'CourseAccessDeniedError';
  }
}

export class AssignmentNotPublishedError extends Error {
  code = 'ASSIGNMENT_NOT_PUBLISHED';
  constructor() {
    super("Vazifa hali e'lon qilinmagan");
    this.name = 'AssignmentNotPublishedError';
  }
}

export class DeadlinePassedError extends Error {
  code = 'DEADLINE_PASSED';
  constructor() {
    super("Topshirish muddati o'tdi");
    this.name = 'DeadlinePassedError';
  }
}

export class NotEnrolledError extends Error {
  code = 'NOT_ENROLLED';
  constructor() {
    super("Bu kursga yozilmagansiz");
    this.name = 'NotEnrolledError';
  }
}

export class SubmissionNotFoundError extends Error {
  code = 'SUBMISSION_NOT_FOUND';
  constructor() {
    super("Topshiriq topilmadi");
    this.name = 'SubmissionNotFoundError';
  }
}

const VALID_STATUSES: ReadonlyArray<AssignmentStatus> = ['draft', 'published', 'archived'];
const VALID_TYPES: ReadonlyArray<SubmissionType> = ['text', 'file', 'url', 'any'];

function validateTitle(t: string) {
  const title = t.trim();
  if (title.length < 2) throw new ValidationError("Sarlavha kamida 2 belgi");
  if (title.length > 200) throw new ValidationError("Sarlavha 200 belgidan oshmasin");
  return title;
}

async function assertCourseOwner(courseId: string, teacherId: string) {
  const c = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  if (!c) throw new ValidationError("Kurs topilmadi");
  if (c.teacherId !== teacherId) throw new CourseAccessDeniedError();
}

async function assertEnrollment(courseId: string, studentId: string) {
  const enrolled = await prisma.enrollment.findFirst({
    where: { courseId, studentId },
    select: { id: true },
  });
  if (!enrolled) throw new NotEnrolledError();
}

// ==================== ASSIGNMENT CRUD ====================

export interface CreateAssignmentServiceInput {
  courseId: string;
  topicId?: string | null;
  title: string;
  description?: string;
  instructions?: string;
  dueDate: Date | string;
  maxScore?: number;
  fileRequirements?: string;
  submissionType?: SubmissionType;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
}

export async function createAssignment(
  teacherId: string,
  input: CreateAssignmentServiceInput,
): Promise<AssignmentRow> {
  await assertCourseOwner(input.courseId, teacherId);
  const title = validateTitle(input.title);

  const dueDate = input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate);
  if (Number.isNaN(dueDate.getTime())) throw new ValidationError("Yaroqsiz sana");

  if (input.maxScore !== undefined) {
    if (input.maxScore < 1 || input.maxScore > 1000) {
      throw new ValidationError("Max bal 1-1000 oralig'ida");
    }
  }
  if (input.submissionType && !VALID_TYPES.includes(input.submissionType)) {
    throw new ValidationError(`Noto'g'ri submission turi: ${input.submissionType}`);
  }
  if (input.latePenaltyPercent !== undefined) {
    if (input.latePenaltyPercent < 0 || input.latePenaltyPercent > 100) {
      throw new ValidationError("Late penalty 0-100 oralig'ida");
    }
  }

  // topic ham kursga tegishlimi
  if (input.topicId) {
    const topic = await prisma.courseTopic.findUnique({
      where: { id: input.topicId },
      select: { courseId: true },
    });
    if (!topic || topic.courseId !== input.courseId) {
      throw new ValidationError("Mavzu ushbu kursga tegishli emas");
    }
  }

  return assignmentRepo.createAssignment({
    teacherId,
    courseId: input.courseId,
    topicId: input.topicId ?? null,
    title,
    description: input.description?.trim() ?? null,
    instructions: input.instructions?.trim() ?? null,
    dueDate,
    maxScore: input.maxScore,
    fileRequirements: input.fileRequirements?.trim() ?? null,
    submissionType: input.submissionType,
    allowLateSubmission: input.allowLateSubmission,
    latePenaltyPercent: input.latePenaltyPercent,
  });
}

export async function getAssignmentForTeacher(
  assignmentId: string,
  teacherId: string,
): Promise<AssignmentRow> {
  const a = await assignmentRepo.findAssignmentById(assignmentId);
  if (!a) throw new AssignmentNotFoundError(assignmentId);
  if (a.teacherId !== teacherId) throw new AssignmentAccessDeniedError();
  return a;
}

export async function listTeacherAssignments(
  teacherId: string,
  filters: { courseId?: string; topicId?: string; status?: AssignmentStatus } = {},
) {
  return assignmentRepo.listAssignments({ teacherId, ...filters });
}

export async function updateAssignment(
  assignmentId: string,
  teacherId: string,
  input: UpdateAssignmentInput & { dueDate?: Date | string },
): Promise<AssignmentRow> {
  const access = await assignmentRepo.isAssignmentOwner(assignmentId, teacherId);
  if (!access.ok) throw new AssignmentAccessDeniedError();

  const patch: UpdateAssignmentInput = {};
  if (input.title !== undefined) patch.title = validateTitle(input.title);
  if (input.description !== undefined) patch.description = input.description;
  if (input.instructions !== undefined) patch.instructions = input.instructions;
  if (input.dueDate !== undefined) {
    const d = input.dueDate instanceof Date ? input.dueDate : new Date(input.dueDate);
    if (Number.isNaN(d.getTime())) throw new ValidationError("Yaroqsiz sana");
    patch.dueDate = d;
  }
  if (input.maxScore !== undefined) {
    if (input.maxScore < 1 || input.maxScore > 1000) {
      throw new ValidationError("Max bal 1-1000 oralig'ida");
    }
    patch.maxScore = input.maxScore;
  }
  if (input.fileRequirements !== undefined) patch.fileRequirements = input.fileRequirements;
  if (input.submissionType !== undefined) {
    if (!VALID_TYPES.includes(input.submissionType as SubmissionType)) {
      throw new ValidationError("Noto'g'ri submission turi");
    }
    patch.submissionType = input.submissionType;
  }
  if (input.allowLateSubmission !== undefined) patch.allowLateSubmission = input.allowLateSubmission;
  if (input.latePenaltyPercent !== undefined) {
    if (input.latePenaltyPercent < 0 || input.latePenaltyPercent > 100) {
      throw new ValidationError("Late penalty 0-100 oralig'ida");
    }
    patch.latePenaltyPercent = input.latePenaltyPercent;
  }
  if (input.status !== undefined) {
    if (!VALID_STATUSES.includes(input.status as AssignmentStatus)) {
      throw new ValidationError(`Noto'g'ri status: ${input.status}`);
    }
    patch.status = input.status;
  }
  if (input.topicId !== undefined) patch.topicId = input.topicId;

  return assignmentRepo.updateAssignment(assignmentId, patch);
}

export async function deleteAssignment(
  assignmentId: string,
  teacherId: string,
): Promise<void> {
  const access = await assignmentRepo.isAssignmentOwner(assignmentId, teacherId);
  if (!access.ok) throw new AssignmentAccessDeniedError();
  await assignmentRepo.deleteAssignment(assignmentId);
}

// ==================== STUDENT SUBMISSIONS ====================

export interface SubmitInput {
  submissionText?: string;
  submissionUrl?: string;
  attachments?: AttachmentJSON[];
}

export async function submitAssignment(
  assignmentId: string,
  studentId: string,
  input: SubmitInput,
): Promise<SubmissionRow> {
  const a = await assignmentRepo.findAssignmentById(assignmentId);
  if (!a) throw new AssignmentNotFoundError(assignmentId);
  if (a.status !== 'published') throw new AssignmentNotPublishedError();

  await assertEnrollment(a.courseId, studentId);

  const isLate = new Date() > a.dueDate;
  if (isLate && !a.allowLateSubmission) {
    throw new DeadlinePassedError();
  }

  // Content validation
  const hasText = !!input.submissionText && input.submissionText.trim().length > 0;
  const hasUrl = !!input.submissionUrl && input.submissionUrl.trim().length > 0;
  const hasFiles = !!input.attachments && input.attachments.length > 0;

  if (!hasText && !hasUrl && !hasFiles) {
    throw new ValidationError("Kamida bittasi: matn, URL yoki fayl");
  }

  if (a.submissionType === 'text' && !hasText) {
    throw new ValidationError("Bu vazifa matnli javob talab qiladi");
  }
  if (a.submissionType === 'file' && !hasFiles) {
    throw new ValidationError("Bu vazifa fayl talab qiladi");
  }
  if (a.submissionType === 'url' && !hasUrl) {
    throw new ValidationError("Bu vazifa URL talab qiladi");
  }

  if (input.submissionUrl) {
    try {
      new URL(input.submissionUrl);
    } catch {
      throw new ValidationError("Yaroqsiz URL");
    }
  }

  return assignmentRepo.upsertSubmission({
    assignmentId,
    studentId,
    courseId: a.courseId,
    submissionText: input.submissionText?.trim() ?? null,
    submissionUrl: input.submissionUrl?.trim() ?? null,
    attachments: input.attachments ?? [],
    isLate,
  });
}

export async function getMySubmission(
  assignmentId: string,
  studentId: string,
): Promise<SubmissionRow | null> {
  return assignmentRepo.findStudentSubmission(assignmentId, studentId);
}

export async function listMySubmissions(studentId: string) {
  return assignmentRepo.listStudentSubmissions(studentId);
}

// ==================== TEACHER GRADING ====================

export async function listSubmissionsForTeacher(
  assignmentId: string,
  teacherId: string,
  filters: { status?: SubmissionStatus } = {},
) {
  const access = await assignmentRepo.isAssignmentOwner(assignmentId, teacherId);
  if (!access.ok) throw new AssignmentAccessDeniedError();
  return assignmentRepo.listAssignmentSubmissions(assignmentId, filters);
}

export interface GradeServiceInput {
  grade: number;
  feedback?: string;
  /** Late penalty automatik qo'llanilsinmi (assignment.latePenaltyPercent) */
  applyLatePenalty?: boolean;
}

export async function gradeSubmission(
  submissionId: string,
  teacherId: string,
  input: GradeServiceInput,
): Promise<SubmissionRow> {
  const submission = await assignmentRepo.findSubmissionById(submissionId);
  if (!submission) throw new SubmissionNotFoundError();
  const assignment = await assignmentRepo.findAssignmentById(submission.assignmentId);
  if (!assignment) throw new AssignmentNotFoundError(submission.assignmentId);
  if (assignment.teacherId !== teacherId) throw new AssignmentAccessDeniedError();

  if (input.grade < 0 || input.grade > assignment.maxScore) {
    throw new ValidationError(`Bal 0-${assignment.maxScore} oralig'ida`);
  }

  let finalGrade = input.grade;
  if (input.applyLatePenalty && submission.isLate && assignment.latePenaltyPercent > 0) {
    const penalty = Math.round((input.grade * assignment.latePenaltyPercent) / 100);
    finalGrade = Math.max(0, input.grade - penalty);
  }

  return assignmentRepo.gradeSubmission(submissionId, {
    grade: finalGrade,
    feedback: input.feedback ?? null,
    graderId: teacherId,
  });
}

export async function returnForRevision(
  submissionId: string,
  teacherId: string,
  feedback: string,
): Promise<SubmissionRow> {
  if (!feedback || feedback.trim().length < 5) {
    throw new ValidationError("Feedback kamida 5 belgi");
  }
  const submission = await assignmentRepo.findSubmissionById(submissionId);
  if (!submission) throw new SubmissionNotFoundError();
  const assignment = await assignmentRepo.findAssignmentById(submission.assignmentId);
  if (!assignment) throw new AssignmentNotFoundError(submission.assignmentId);
  if (assignment.teacherId !== teacherId) throw new AssignmentAccessDeniedError();

  return assignmentRepo.returnSubmission(submissionId, feedback.trim(), teacherId);
}
