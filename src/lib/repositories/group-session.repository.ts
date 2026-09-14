/**
 * Group Session repository — `group_sessions`, `group_session_attendance`.
 *
 * Guruhning jadvalli jonli darslari (Google Meet/Zoom havolasi qo'lda qo'yiladi):
 *   - Sessiya CRUD (bir martalik + takroriy seriya)
 *   - O'quvchi uchun yaqin darslar (a'zo bo'lgan guruhlar bo'yicha)
 *   - Eslatma cron uchun "muddati kelgan" sessiyalar
 *   - Davomat (qo'shilish yozuvi)
 */

import { prisma } from '@/lib/prisma';

export type GroupSessionStatus = 'scheduled' | 'cancelled';

export interface GroupSessionRow {
  id: string;
  groupId: string;
  title: string;
  startsAt: Date;
  durationMin: number;
  meetingUrl: string;
  status: string;
  seriesId: string | null;
  reminderSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSessionInput {
  groupId: string;
  title: string;
  startsAt: Date;
  durationMin: number;
  meetingUrl: string;
  seriesId?: string | null;
}

// ==================== CRUD ====================

export async function createSession(input: CreateSessionInput): Promise<GroupSessionRow> {
  return prisma.groupSession.create({
    data: {
      groupId: input.groupId,
      title: input.title,
      startsAt: input.startsAt,
      durationMin: input.durationMin,
      meetingUrl: input.meetingUrl,
      seriesId: input.seriesId ?? null,
    },
  });
}

/** Takroriy seriya — bir nechta sessiyani bitta seriesId bilan yaratadi. */
export async function createSeries(inputs: CreateSessionInput[]): Promise<GroupSessionRow[]> {
  return prisma.groupSession.createManyAndReturn({
    data: inputs.map((i) => ({
      groupId: i.groupId,
      title: i.title,
      startsAt: i.startsAt,
      durationMin: i.durationMin,
      meetingUrl: i.meetingUrl,
      seriesId: i.seriesId ?? null,
    })),
  });
}

export async function findById(id: string): Promise<GroupSessionRow | null> {
  return prisma.groupSession.findUnique({ where: { id } });
}

/** Guruhning barcha sessiyalari (kelayotgan birinchi). */
export async function listByGroup(
  groupId: string,
  opts: { upcomingOnly?: boolean } = {},
): Promise<GroupSessionRow[]> {
  return prisma.groupSession.findMany({
    where: {
      groupId,
      ...(opts.upcomingOnly ? { startsAt: { gte: new Date() }, status: 'scheduled' } : {}),
    },
    orderBy: { startsAt: opts.upcomingOnly ? 'asc' : 'desc' },
  });
}

export interface UpdateSessionInput {
  title?: string;
  startsAt?: Date;
  durationMin?: number;
  meetingUrl?: string;
}

export async function updateSession(id: string, patch: UpdateSessionInput): Promise<GroupSessionRow> {
  return prisma.groupSession.update({ where: { id }, data: patch });
}

export async function cancelSession(id: string): Promise<void> {
  await prisma.groupSession.update({ where: { id }, data: { status: 'cancelled' } });
}

/** Seriyaning KELAYOTGAN sessiyalarini bekor qiladi (o'tganlar tegilmaydi). */
export async function cancelSeriesUpcoming(seriesId: string): Promise<number> {
  const res = await prisma.groupSession.updateMany({
    where: { seriesId, status: 'scheduled', startsAt: { gte: new Date() } },
    data: { status: 'cancelled' },
  });
  return res.count;
}

export async function deleteSession(id: string): Promise<void> {
  await prisma.groupSession.delete({ where: { id } });
}

// ==================== OWNERSHIP ====================

/** Sessiya shu o'qituvchining guruhiga tegishlimi? (guruh.teacherId orqali) */
export async function isSessionOwnedBy(
  sessionId: string,
  teacherId: string,
): Promise<{ ok: boolean; session: GroupSessionRow | null }> {
  const s = await prisma.groupSession.findFirst({
    where: { id: sessionId, group: { teacherId } },
  });
  return { ok: !!s, session: s };
}

// ==================== STUDENT ====================

/** O'quvchi shu sessiya guruhining a'zosimi + sessiyani qaytaradi. */
export async function getSessionForMember(
  sessionId: string,
  studentId: string,
): Promise<GroupSessionRow | null> {
  return prisma.groupSession.findFirst({
    where: { id: sessionId, group: { members: { some: { studentId } } } },
  });
}

export interface StudentSessionRow extends GroupSessionRow {
  group: { id: string; name: string; color: string };
}

/**
 * O'quvchining yaqin darslari — a'zo bo'lgan guruhlarning kelayotgan (yoki hozir
 * ketayotgan) sessiyalari. Hozir ketayotganini ko'rsatish uchun startsAt >= now - 3 soat
 * emas, balki tugash vaqti (starts + duration) hali o'tmaganlarni ham qamraydi.
 */
export async function listUpcomingForStudent(
  studentId: string,
  limit = 20,
): Promise<StudentSessionRow[]> {
  // Boshlanishiga <= 3 soat qolgan yoki hali tugamaganlar. Oddiy filtr: startsAt >= now - 6 soat
  // (uzoq darslarni ham qamrash uchun), keyin ilova tomonida holat hisoblanadi.
  const cutoff = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const rows = await prisma.groupSession.findMany({
    where: {
      status: 'scheduled',
      startsAt: { gte: cutoff },
      group: { members: { some: { studentId } }, status: 'active' },
    },
    orderBy: { startsAt: 'asc' },
    take: limit,
    include: { group: { select: { id: true, name: true, color: true } } },
  });
  return rows as StudentSessionRow[];
}

// ==================== REMINDERS (cron) ====================

/**
 * Eslatma yuborilishi kerak bo'lgan sessiyalar: hali eslatma yuborilmagan,
 * status scheduled, boshlanishiga [0, windowMin] daqiqa qolgan.
 */
export async function listDueReminders(windowMin: number): Promise<GroupSessionRow[]> {
  const now = new Date();
  const until = new Date(now.getTime() + windowMin * 60 * 1000);
  return prisma.groupSession.findMany({
    where: {
      status: 'scheduled',
      reminderSentAt: null,
      startsAt: { gte: now, lte: until },
    },
    orderBy: { startsAt: 'asc' },
  });
}

export async function markReminderSent(sessionId: string): Promise<void> {
  await prisma.groupSession.update({
    where: { id: sessionId },
    data: { reminderSentAt: new Date() },
  });
}

/** Sessiya guruhining a'zo id'lari (eslatma/broadcast uchun). */
export async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const rows = await prisma.groupMember.findMany({
    where: { groupId },
    select: { studentId: true },
  });
  return rows.map((r) => r.studentId);
}

// ==================== ATTENDANCE ====================

/** O'quvchi "qo'shilish"ni bosganda davomat yoziladi (idempotent — upsert). */
export async function recordAttendance(sessionId: string, studentId: string): Promise<void> {
  await prisma.groupSessionAttendance.upsert({
    where: { sessionId_studentId: { sessionId, studentId } },
    update: {},
    create: { sessionId, studentId },
  });
}

export interface AttendanceRow {
  studentId: string;
  fullName: string | null;
  avatarUrl: string | null;
  joinedAt: Date;
}

/** Sessiyaga qo'shilgan o'quvchilar (o'qituvchi ko'rishi uchun, profil bilan). */
export async function listAttendance(sessionId: string): Promise<AttendanceRow[]> {
  const rows = await prisma.groupSessionAttendance.findMany({
    where: { sessionId },
    orderBy: { joinedAt: 'asc' },
  });
  if (rows.length === 0) return [];
  const profiles = await prisma.userProfile.findMany({
    where: { id: { in: rows.map((r) => r.studentId) } },
    select: { id: true, fullName: true, avatarUrl: true },
  });
  const byId = new Map(profiles.map((p) => [p.id, p]));
  return rows.map((r) => ({
    studentId: r.studentId,
    fullName: byId.get(r.studentId)?.fullName ?? null,
    avatarUrl: byId.get(r.studentId)?.avatarUrl ?? null,
    joinedAt: r.joinedAt,
  }));
}

/** Sessiyaga qo'shilganlar soni (o'qituvchi ro'yxatida ko'rsatish uchun). */
export async function attendanceCounts(sessionIds: string[]): Promise<Map<string, number>> {
  if (sessionIds.length === 0) return new Map();
  const grouped = await prisma.groupSessionAttendance.groupBy({
    by: ['sessionId'],
    where: { sessionId: { in: sessionIds } },
    _count: { studentId: true },
  });
  return new Map(grouped.map((g) => [g.sessionId, g._count.studentId]));
}
