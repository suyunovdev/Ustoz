/**
 * Group repository — `groups`, `group_members`.
 *
 * Imkoniyatlar:
 *   - Group CRUD (teacher owner check)
 *   - Member add/remove (capacity check)
 *   - Members ro'yxati (talaba profili bilan)
 *   - Group bo'yicha notification broadcast
 */

import { prisma } from '@/lib/prisma';

export type GroupStatus = 'active' | 'archived';
export type GroupColor =
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'pink';

export interface GroupRow {
  id: string;
  teacherId: string;
  courseId: string | null;
  name: string;
  description: string | null;
  maxMembers: number;
  status: string;
  meetingUrl: string | null;
  scheduleNote: string | null;
  color: string;
  memberCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== GROUP CRUD ====================

export interface CreateGroupInput {
  teacherId: string;
  name: string;
  description?: string | null;
  courseId?: string | null;
  maxMembers?: number;
  meetingUrl?: string | null;
  scheduleNote?: string | null;
  color?: GroupColor;
}

export async function createGroup(input: CreateGroupInput): Promise<GroupRow> {
  return prisma.group.create({
    data: {
      teacherId: input.teacherId,
      name: input.name,
      description: input.description ?? null,
      courseId: input.courseId ?? null,
      maxMembers: input.maxMembers ?? 30,
      meetingUrl: input.meetingUrl ?? null,
      scheduleNote: input.scheduleNote ?? null,
      color: input.color ?? 'blue',
      status: 'active',
    },
  });
}

export async function findGroupById(id: string): Promise<GroupRow | null> {
  // memberCount — JONLI hisoblanadi (_count.members). Denormalizatsiya qilingan
  // `memberCount` ustuni cascade delete'da (talaba akkaunti o'chirilsa) eskirib
  // qolardi va guruh soxta "to'la" bo'lardi. Endi hech qanday drift yo'q.
  const g = await prisma.group.findUnique({
    where: { id },
    include: { _count: { select: { members: true } } },
  });
  if (!g) return null;
  const { _count, ...rest } = g;
  return { ...rest, memberCount: _count.members };
}

export interface ListGroupsFilters {
  teacherId?: string;
  courseId?: string;
  status?: GroupStatus;
  search?: string;
}

export async function listGroups(
  filters: ListGroupsFilters,
): Promise<Array<GroupRow & { courseTitle: string | null }>> {
  const where: any = {};
  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const rows = await prisma.group.findMany({
    where,
    include: {
      course: { select: { title: true } },
      // memberCount — jonli (denormalizatsiya drift'iga qarshi, findGroupById'dagidek).
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return rows.map((r) => ({
    id: r.id,
    teacherId: r.teacherId,
    courseId: r.courseId,
    name: r.name,
    description: r.description,
    maxMembers: r.maxMembers,
    status: r.status,
    meetingUrl: r.meetingUrl,
    scheduleNote: r.scheduleNote,
    color: r.color,
    memberCount: r._count.members,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    courseTitle: r.course?.title ?? null,
  }));
}

export interface UpdateGroupInput {
  name?: string;
  description?: string | null;
  courseId?: string | null;
  maxMembers?: number;
  status?: GroupStatus;
  meetingUrl?: string | null;
  scheduleNote?: string | null;
  color?: GroupColor;
}

export async function updateGroup(
  id: string,
  data: UpdateGroupInput,
): Promise<GroupRow> {
  return prisma.group.update({ where: { id }, data });
}

export async function deleteGroup(id: string): Promise<void> {
  await prisma.group.delete({ where: { id } });
}

export async function isGroupOwner(
  groupId: string,
  teacherId: string,
): Promise<{ ok: boolean }> {
  const g = await prisma.group.findUnique({
    where: { id: groupId },
    select: { teacherId: true },
  });
  return { ok: !!g && g.teacherId === teacherId };
}

// ==================== MEMBERS ====================

export interface MemberRow {
  studentId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  joinedAt: Date;
}

export async function listMembers(groupId: string): Promise<MemberRow[]> {
  const rows = await prisma.groupMember.findMany({
    where: { groupId },
    include: {
      student: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });
  return rows.map((r) => ({
    studentId: r.student.id,
    fullName: r.student.fullName,
    email: r.student.email,
    avatarUrl: r.student.avatarUrl,
    joinedAt: r.joinedAt,
  }));
}

/**
 * Add member — capacity check + denormalized memberCount oshirish.
 * Allaqachon a'zo bo'lsa, conflict tashlanadi.
 */
export async function addMember(
  groupId: string,
  studentId: string,
): Promise<MemberRow> {
  return prisma.$transaction(async (tx) => {
    // Guruh qatorini qulflab olamiz — concurrent qo'shishlar navbatga tushadi,
    // sig'im (maxMembers) oshib ketmaydi.
    await tx.$queryRaw`SELECT id FROM groups WHERE id = ${groupId}::uuid FOR UPDATE`;
    const g = await tx.group.findUnique({
      where: { id: groupId },
      select: { maxMembers: true },
    });
    if (!g) throw new Error('GROUP_NOT_FOUND');
    // Sig'im — HAQIQIY a'zolar soni bo'yicha (denormalizatsiya emas → drift yo'q).
    const current = await tx.groupMember.count({ where: { groupId } });
    if (current >= g.maxMembers) throw new Error('GROUP_FULL');

    // Conflict — composite primary key (groupId, studentId)
    const existing = await tx.groupMember.findUnique({
      where: { groupId_studentId: { groupId, studentId } },
    });
    if (existing) throw new Error('ALREADY_MEMBER');

    const created = await tx.groupMember.create({
      data: { groupId, studentId },
      include: {
        student: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
    });
    return {
      studentId: created.student.id,
      fullName: created.student.fullName,
      email: created.student.email,
      avatarUrl: created.student.avatarUrl,
      joinedAt: created.joinedAt,
    };
  });
}

export async function removeMember(groupId: string, studentId: string): Promise<void> {
  // memberCount jonli hisoblangani uchun (findGroupById/listGroups) faqat
  // a'zolik qatorini o'chiramiz. deleteMany — idempotent (bo'lmasa ham xato yo'q).
  await prisma.groupMember.deleteMany({ where: { groupId, studentId } });
}

/**
 * Bulk add — bir nechta talabani qo'shish (capacity check bilan).
 * Allaqachon a'zo bo'lganlar — silently skip.
 */
export async function addMembersBulk(
  groupId: string,
  studentIds: string[],
): Promise<{ added: number; alreadyMember: number; noCapacity: number }> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM groups WHERE id = ${groupId}::uuid FOR UPDATE`;
    const g = await tx.group.findUnique({
      where: { id: groupId },
      select: { maxMembers: true },
    });
    if (!g) throw new Error('GROUP_NOT_FOUND');
    // Sig'im — HAQIQIY a'zolar soni bo'yicha (drift yo'q).
    const current = await tx.groupMember.count({ where: { groupId } });
    const slotsLeft = Math.max(0, g.maxMembers - current);

    const existing = await tx.groupMember.findMany({
      where: { groupId, studentId: { in: studentIds } },
      select: { studentId: true },
    });
    const existingSet = new Set(existing.map((e) => e.studentId));
    const alreadyMember = studentIds.filter((id) => existingSet.has(id)).length;

    // Yangi nomzodlar; sig'imga sig'maganlar — noCapacity (allaqachon a'zolardan alohida).
    const candidates = studentIds.filter((id) => !existingSet.has(id));
    const toAdd = candidates.slice(0, slotsLeft);
    const noCapacity = candidates.length - toAdd.length;

    if (toAdd.length === 0) {
      return { added: 0, alreadyMember, noCapacity };
    }

    const created = await tx.groupMember.createMany({
      data: toAdd.map((studentId) => ({ groupId, studentId })),
      skipDuplicates: true,
    });

    return { added: created.count, alreadyMember, noCapacity };
  });
}

// ==================== NOTIFY ====================

export async function getMemberIds(groupId: string): Promise<string[]> {
  const rows = await prisma.groupMember.findMany({
    where: { groupId },
    select: { studentId: true },
  });
  return rows.map((r) => r.studentId);
}
