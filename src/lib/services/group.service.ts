/**
 * Group Service
 * -------------
 * Biznes logika:
 *   - Group CRUD + ownership check
 *   - Member add/remove + capacity check
 *   - Student must be enrolled in teacher's courses to be added
 *   - Group bo'yicha bildirishnoma yuborish
 */

import {
  groupRepo,
  type GroupRow,
  type MemberRow,
  type GroupStatus,
  type GroupColor,
  type UpdateGroupInput,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export class GroupNotFoundError extends Error {
  code = 'GROUP_NOT_FOUND';
  constructor(id: string) {
    super(`Guruh topilmadi: ${id}`);
    this.name = 'GroupNotFoundError';
  }
}

export class GroupAccessDeniedError extends Error {
  code = 'GROUP_ACCESS_DENIED';
  constructor() {
    super("Bu guruh sizniki emas");
    this.name = 'GroupAccessDeniedError';
  }
}

export class GroupFullError extends Error {
  code = 'GROUP_FULL';
  constructor() {
    super("Guruh to'lgan — yangi a'zo qo'shib bo'lmaydi");
    this.name = 'GroupFullError';
  }
}

export class AlreadyMemberError extends Error {
  code = 'ALREADY_MEMBER';
  constructor() {
    super("Talaba allaqachon a'zo");
    this.name = 'AlreadyMemberError';
  }
}

export class StudentNotEnrolledError extends Error {
  code = 'STUDENT_NOT_ENROLLED';
  constructor() {
    super("Talaba kurslaringizga yozilmagan");
    this.name = 'StudentNotEnrolledError';
  }
}

const VALID_COLORS: ReadonlyArray<GroupColor> = [
  'blue',
  'green',
  'red',
  'yellow',
  'purple',
  'orange',
  'pink',
];

const VALID_STATUSES: ReadonlyArray<GroupStatus> = ['active', 'archived'];

function validateName(n: string) {
  const name = n.trim();
  if (name.length < 2) throw new ValidationError("Nom kamida 2 belgi");
  if (name.length > 100) throw new ValidationError("Nom 100 belgidan oshmasin");
  return name;
}

async function assertCourseOwner(courseId: string, teacherId: string) {
  const c = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  if (!c) throw new ValidationError("Kurs topilmadi");
  if (c.teacherId !== teacherId) throw new ValidationError("Bu kurs sizniki emas");
}

// ==================== GROUP CRUD ====================

export interface CreateGroupServiceInput {
  name: string;
  description?: string;
  courseId?: string | null;
  maxMembers?: number;
  meetingUrl?: string;
  scheduleNote?: string;
  color?: GroupColor;
}

export async function createGroup(
  teacherId: string,
  input: CreateGroupServiceInput,
): Promise<GroupRow> {
  const name = validateName(input.name);
  if (input.courseId) await assertCourseOwner(input.courseId, teacherId);
  if (input.maxMembers !== undefined) {
    if (input.maxMembers < 1 || input.maxMembers > 1000) {
      throw new ValidationError("Maksimum a'zolar 1-1000 oralig'ida");
    }
  }
  if (input.color && !VALID_COLORS.includes(input.color)) {
    throw new ValidationError(`Noto'g'ri rang: ${input.color}`);
  }
  if (input.meetingUrl) {
    try {
      new URL(input.meetingUrl);
    } catch {
      throw new ValidationError("Yaroqsiz meeting URL");
    }
  }

  return groupRepo.createGroup({
    teacherId,
    name,
    description: input.description?.trim() ?? null,
    courseId: input.courseId ?? null,
    maxMembers: input.maxMembers,
    meetingUrl: input.meetingUrl ?? null,
    scheduleNote: input.scheduleNote?.trim() ?? null,
    color: input.color,
  });
}

export async function getGroupForTeacher(
  groupId: string,
  teacherId: string,
): Promise<GroupRow> {
  const g = await groupRepo.findGroupById(groupId);
  if (!g) throw new GroupNotFoundError(groupId);
  if (g.teacherId !== teacherId) throw new GroupAccessDeniedError();
  return g;
}

export async function listTeacherGroups(
  teacherId: string,
  filters: { courseId?: string; status?: GroupStatus; search?: string } = {},
) {
  return groupRepo.listGroups({ teacherId, ...filters });
}

export async function updateGroup(
  groupId: string,
  teacherId: string,
  input: UpdateGroupInput,
): Promise<GroupRow> {
  const access = await groupRepo.isGroupOwner(groupId, teacherId);
  if (!access.ok) throw new GroupAccessDeniedError();

  const patch: UpdateGroupInput = {};
  if (input.name !== undefined) patch.name = validateName(input.name);
  if (input.description !== undefined) patch.description = input.description;
  if (input.courseId !== undefined) {
    if (input.courseId) await assertCourseOwner(input.courseId, teacherId);
    patch.courseId = input.courseId;
  }
  if (input.maxMembers !== undefined) {
    if (input.maxMembers < 1 || input.maxMembers > 1000) {
      throw new ValidationError("Maksimum a'zolar 1-1000 oralig'ida");
    }
    patch.maxMembers = input.maxMembers;
  }
  if (input.status !== undefined) {
    if (!VALID_STATUSES.includes(input.status as GroupStatus)) {
      throw new ValidationError(`Noto'g'ri status: ${input.status}`);
    }
    patch.status = input.status;
  }
  if (input.meetingUrl !== undefined) {
    if (input.meetingUrl) {
      try {
        new URL(input.meetingUrl);
      } catch {
        throw new ValidationError("Yaroqsiz meeting URL");
      }
    }
    patch.meetingUrl = input.meetingUrl;
  }
  if (input.scheduleNote !== undefined) patch.scheduleNote = input.scheduleNote;
  if (input.color !== undefined) {
    if (!VALID_COLORS.includes(input.color as GroupColor)) {
      throw new ValidationError(`Noto'g'ri rang: ${input.color}`);
    }
    patch.color = input.color;
  }

  return groupRepo.updateGroup(groupId, patch);
}

export async function deleteGroup(groupId: string, teacherId: string): Promise<void> {
  const access = await groupRepo.isGroupOwner(groupId, teacherId);
  if (!access.ok) throw new GroupAccessDeniedError();
  await groupRepo.deleteGroup(groupId);
}

// ==================== MEMBERS ====================

/**
 * Talaba teacher'ning biror kursiga yozilganligini tekshirish.
 * Faqat enrolled talabani guruhga qo'shish mumkin.
 */
async function assertStudentEligible(studentId: string, teacherId: string) {
  const enrolled = await prisma.enrollment.findFirst({
    where: { studentId, course: { teacherId } },
    select: { id: true },
  });
  if (!enrolled) throw new StudentNotEnrolledError();
}

export async function listGroupMembers(
  groupId: string,
  teacherId: string,
): Promise<MemberRow[]> {
  const access = await groupRepo.isGroupOwner(groupId, teacherId);
  if (!access.ok) throw new GroupAccessDeniedError();
  return groupRepo.listMembers(groupId);
}

export async function addGroupMember(
  groupId: string,
  teacherId: string,
  studentId: string,
): Promise<MemberRow> {
  const access = await groupRepo.isGroupOwner(groupId, teacherId);
  if (!access.ok) throw new GroupAccessDeniedError();

  await assertStudentEligible(studentId, teacherId);

  try {
    return await groupRepo.addMember(groupId, studentId);
  } catch (err: any) {
    if (err?.message === 'GROUP_FULL') throw new GroupFullError();
    if (err?.message === 'ALREADY_MEMBER') throw new AlreadyMemberError();
    if (err?.message === 'GROUP_NOT_FOUND') throw new GroupNotFoundError(groupId);
    throw err;
  }
}

export async function removeGroupMember(
  groupId: string,
  teacherId: string,
  studentId: string,
): Promise<void> {
  const access = await groupRepo.isGroupOwner(groupId, teacherId);
  if (!access.ok) throw new GroupAccessDeniedError();
  await groupRepo.removeMember(groupId, studentId);
}

/**
 * Bulk add — bir nechta talabani bir vaqtda qo'shish.
 * Har biri uchun enrolled tekshiruvi qilinadi (no-eligible'lar skip).
 */
export async function addGroupMembersBulk(
  groupId: string,
  teacherId: string,
  studentIds: string[],
): Promise<{ added: number; skipped: number; ineligible: number }> {
  const access = await groupRepo.isGroupOwner(groupId, teacherId);
  if (!access.ok) throw new GroupAccessDeniedError();

  if (studentIds.length === 0) return { added: 0, skipped: 0, ineligible: 0 };
  if (studentIds.length > 500) {
    throw new ValidationError("Bir vaqtda 500 ta maksimum");
  }

  // Enrolled talabalarni filter qilish
  const eligible = await prisma.enrollment.findMany({
    where: { studentId: { in: studentIds }, course: { teacherId } },
    select: { studentId: true },
    distinct: ['studentId'],
  });
  const eligibleIds = Array.from(new Set(eligible.map((e) => e.studentId)));
  const ineligible = studentIds.length - eligibleIds.length;

  if (eligibleIds.length === 0) {
    return { added: 0, skipped: 0, ineligible };
  }

  const result = await groupRepo.addMembersBulk(groupId, eligibleIds);
  return {
    added: result.added,
    skipped: result.skipped,
    ineligible,
  };
}

// ==================== NOTIFY ====================

export interface BroadcastGroupInput {
  title: string;
  message: string;
}

export async function broadcastToGroup(
  groupId: string,
  teacherId: string,
  input: BroadcastGroupInput,
): Promise<{ sent: number }> {
  const access = await groupRepo.isGroupOwner(groupId, teacherId);
  if (!access.ok) throw new GroupAccessDeniedError();

  const title = input.title.trim();
  const message = input.message.trim();
  if (title.length < 2) throw new ValidationError("Sarlavha kamida 2 belgi");
  if (message.length < 2) throw new ValidationError("Xabar kamida 2 belgi");
  if (message.length > 2000) throw new ValidationError("Xabar 2000 belgidan oshmasin");

  const memberIds = await groupRepo.getMemberIds(groupId);
  if (memberIds.length === 0) return { sent: 0 };

  const group = await groupRepo.findGroupById(groupId);

  await prisma.notification.createMany({
    data: memberIds.map((id) => ({
      recipientId: id,
      senderId: teacherId,
      type: 'course_update' as const,
      title,
      message,
      relatedCourseId: group?.courseId ?? null,
    })),
  });

  return { sent: memberIds.length };
}
