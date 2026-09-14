/**
 * Group Session Service — guruhning jonli darslari (Google Meet/Zoom).
 *
 * Biznes logika:
 *   - O'qituvchi: sessiya yaratish (bir martalik + takroriy seriya), tahrir, bekor
 *   - O'quvchi: yaqin darslar ro'yxati + "darsga qo'shilish" (davomat yoziladi)
 *   - Eslatma cron: muddati kelgan sessiyalar uchun a'zolarga bildirishnoma
 *
 * Vaqt mintaqasi: takroriy sanalar BRAUZERDA hisoblanadi (foydalanuvchi TZ'sida) va
 * server ISO datetime ro'yxatini qabul qiladi — server tomonda TZ matematikasi yo'q.
 */

import { groupSessionRepo, groupRepo } from '@/lib/repositories';
import type { GroupSessionRow } from '@/lib/repositories/group-session.repository';
import { ValidationError, ForbiddenError } from '@/lib/errors';
import { isHttpUrl } from '@/lib/validation';
import { prisma } from '@/lib/prisma';

const MAX_OCCURRENCES = 60;
const JOIN_EARLY_MIN = 15; // darsdan necha daqiqa oldin qo'shilsa bo'ladi
const JOIN_GRACE_MIN = 30; // tugagach necha daqiqa davomat yoziladi

// ==================== VALIDATSIYA ====================

function validateTitle(t: string): string {
  const title = t.trim();
  if (title.length < 2) throw new ValidationError('Dars nomi kamida 2 belgi');
  if (title.length > 200) throw new ValidationError('Dars nomi 200 belgidan oshmasin');
  return title;
}

function validateDuration(min: number): number {
  if (!Number.isInteger(min) || min < 10 || min > 480) {
    throw new ValidationError("Davomiylik 10-480 daqiqa oralig'ida bo'lsin");
  }
  return min;
}

function validateMeetingUrl(url: string): string {
  const u = url.trim();
  if (!isHttpUrl(u)) throw new ValidationError('Yaroqsiz Meet havolasi (http/https bo\'lsin)');
  if (u.length > 500) throw new ValidationError('Havola juda uzun');
  return u;
}

function parseStart(value: string | Date): Date {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) throw new ValidationError("Yaroqsiz sana/vaqt");
  // O'tmishga 1 soatdan ko'p bo'lmasin (kichik xatolikka yo'l qo'yamiz).
  if (d.getTime() < Date.now() - 60 * 60 * 1000) {
    throw new ValidationError("Dars vaqti o'tmishda bo'lishi mumkin emas");
  }
  return d;
}

async function assertGroupOwner(groupId: string, teacherId: string) {
  const access = await groupRepo.isGroupOwner(groupId, teacherId);
  if (!access.ok) throw new ForbiddenError('Bu guruh sizniki emas');
}

// ==================== O'QITUVCHI: YARATISH ====================

export interface CreateSessionServiceInput {
  title: string;
  startsAt: string | Date;
  durationMin: number;
  meetingUrl: string;
}

export async function createSession(
  teacherId: string,
  groupId: string,
  input: CreateSessionServiceInput,
): Promise<GroupSessionRow> {
  await assertGroupOwner(groupId, teacherId);
  const title = validateTitle(input.title);
  const durationMin = validateDuration(input.durationMin);
  const meetingUrl = validateMeetingUrl(input.meetingUrl);
  const startsAt = parseStart(input.startsAt);

  const session = await groupSessionRepo.createSession({
    groupId,
    title,
    startsAt,
    durationMin,
    meetingUrl,
  });
  await notifyMembersScheduled(groupId, teacherId, 1);
  return session;
}

export interface CreateSeriesServiceInput {
  title: string;
  occurrences: string[]; // ISO datetime ro'yxati (brauzer hisoblaydi)
  durationMin: number;
  meetingUrl: string;
}

export async function createSessionSeries(
  teacherId: string,
  groupId: string,
  input: CreateSeriesServiceInput,
): Promise<GroupSessionRow[]> {
  await assertGroupOwner(groupId, teacherId);
  const title = validateTitle(input.title);
  const durationMin = validateDuration(input.durationMin);
  const meetingUrl = validateMeetingUrl(input.meetingUrl);

  if (!Array.isArray(input.occurrences) || input.occurrences.length === 0) {
    throw new ValidationError("Kamida bitta dars sanasi kerak");
  }
  if (input.occurrences.length > MAX_OCCURRENCES) {
    throw new ValidationError(`Bir seriyada ${MAX_OCCURRENCES} tadan ko'p dars bo'lmasin`);
  }
  const starts = input.occurrences.map((o) => parseStart(o));
  const seriesId = crypto.randomUUID();

  const sessions = await groupSessionRepo.createSeries(
    starts.map((startsAt) => ({ groupId, title, startsAt, durationMin, meetingUrl, seriesId })),
  );
  await notifyMembersScheduled(groupId, teacherId, sessions.length);
  return sessions;
}

// ==================== O'QITUVCHI: RO'YXAT / TAHRIR / BEKOR ====================

export async function listGroupSessions(
  teacherId: string,
  groupId: string,
  opts: { upcomingOnly?: boolean } = {},
): Promise<Array<GroupSessionRow & { attendeeCount: number }>> {
  await assertGroupOwner(groupId, teacherId);
  const sessions = await groupSessionRepo.listByGroup(groupId, opts);
  const counts = await groupSessionRepo.attendanceCounts(sessions.map((s) => s.id));
  return sessions.map((s) => ({ ...s, attendeeCount: counts.get(s.id) ?? 0 }));
}

export interface UpdateSessionServiceInput {
  title?: string;
  startsAt?: string | Date;
  durationMin?: number;
  meetingUrl?: string;
}

export async function updateSession(
  teacherId: string,
  sessionId: string,
  input: UpdateSessionServiceInput,
): Promise<GroupSessionRow> {
  const { ok } = await groupSessionRepo.isSessionOwnedBy(sessionId, teacherId);
  if (!ok) throw new ForbiddenError('Bu sessiya sizniki emas');

  const patch: { title?: string; startsAt?: Date; durationMin?: number; meetingUrl?: string } = {};
  if (input.title !== undefined) patch.title = validateTitle(input.title);
  if (input.durationMin !== undefined) patch.durationMin = validateDuration(input.durationMin);
  if (input.meetingUrl !== undefined) patch.meetingUrl = validateMeetingUrl(input.meetingUrl);
  if (input.startsAt !== undefined) patch.startsAt = parseStart(input.startsAt);

  return groupSessionRepo.updateSession(sessionId, patch);
}

export async function cancelSession(teacherId: string, sessionId: string): Promise<void> {
  const { ok } = await groupSessionRepo.isSessionOwnedBy(sessionId, teacherId);
  if (!ok) throw new ForbiddenError('Bu sessiya sizniki emas');
  await groupSessionRepo.cancelSession(sessionId);
}

/** Seriyaning kelayotgan barcha darslarini bekor qiladi. */
export async function cancelSeries(
  teacherId: string,
  sessionId: string,
): Promise<{ cancelled: number }> {
  const { ok, session } = await groupSessionRepo.isSessionOwnedBy(sessionId, teacherId);
  if (!ok || !session) throw new ForbiddenError('Bu sessiya sizniki emas');
  if (!session.seriesId) {
    await groupSessionRepo.cancelSession(sessionId);
    return { cancelled: 1 };
  }
  const cancelled = await groupSessionRepo.cancelSeriesUpcoming(session.seriesId);
  return { cancelled };
}

export async function getSessionAttendance(teacherId: string, sessionId: string) {
  const { ok } = await groupSessionRepo.isSessionOwnedBy(sessionId, teacherId);
  if (!ok) throw new ForbiddenError('Bu sessiya sizniki emas');
  return groupSessionRepo.listAttendance(sessionId);
}

// ==================== O'QUVCHI ====================

export async function listMyUpcomingSessions(studentId: string) {
  return groupSessionRepo.listUpcomingForStudent(studentId);
}

/**
 * O'quvchi darsga qo'shiladi:
 *   - guruh a'zosi bo'lishi shart
 *   - bekor qilingan bo'lmasligi kerak
 *   - jonli oyna ichida (darsdan 15 daq oldin — tugagach 30 daq) davomat yoziladi
 *   - Meet havolasini qaytaradi
 */
export async function joinSession(
  studentId: string,
  sessionId: string,
): Promise<{ meetingUrl: string; recorded: boolean }> {
  const session = await groupSessionRepo.getSessionForMember(sessionId, studentId);
  if (!session) throw new ForbiddenError("Siz bu guruh a'zosi emassiz yoki dars topilmadi");
  if (session.status === 'cancelled') {
    throw new ValidationError('Bu dars bekor qilingan');
  }

  const now = Date.now();
  const start = session.startsAt.getTime();
  const end = start + session.durationMin * 60 * 1000;
  const windowOpen = start - JOIN_EARLY_MIN * 60 * 1000;
  const windowClose = end + JOIN_GRACE_MIN * 60 * 1000;

  let recorded = false;
  if (now >= windowOpen && now <= windowClose) {
    await groupSessionRepo.recordAttendance(sessionId, studentId);
    recorded = true;
  }
  return { meetingUrl: session.meetingUrl, recorded };
}

// ==================== BILDIRISHNOMA ====================

/**
 * Cron: boshlanishiga ~windowMin daqiqa qolgan darslar uchun a'zolarga eslatma.
 * Har sessiya bir marta eslatiladi (reminderSentAt orqali idempotent).
 */
export async function sendDueSessionReminders(
  windowMin = 20,
): Promise<{ sessions: number; notified: number }> {
  const due = await groupSessionRepo.listDueReminders(windowMin);
  let notified = 0;
  for (const session of due) {
    const memberIds = await groupSessionRepo.getGroupMemberIds(session.groupId);
    if (memberIds.length > 0) {
      const minutes = Math.max(1, Math.round((session.startsAt.getTime() - Date.now()) / 60000));
      await prisma.notification.createMany({
        data: memberIds.map((id) => ({
          recipientId: id,
          type: 'live_session' as const,
          title: 'Jonli dars boshlanmoqda',
          message: `"${session.title}" darsi ${minutes} daqiqadan so'ng boshlanadi. Qo'shilishga tayyor bo'ling.`,
          relatedEntityId: session.id,
          metadata: { kind: 'session_reminder', sessionId: session.id },
        })),
      });
      notified += memberIds.length;
    }
    // A'zo bo'lmasa ham reminderSentAt belgilanadi — qayta urinmaslik uchun.
    await groupSessionRepo.markReminderSent(session.id);
  }
  return { sessions: due.length, notified };
}

/** Guruh a'zolariga "yangi dars rejalashtirildi" bildirishnomasi (in-app). */
async function notifyMembersScheduled(groupId: string, teacherId: string, count: number) {
  const memberIds = await groupSessionRepo.getGroupMemberIds(groupId);
  if (memberIds.length === 0) return;
  const group = await groupRepo.findGroupById(groupId);
  const title = count > 1 ? 'Yangi jonli darslar rejalashtirildi' : 'Yangi jonli dars rejalashtirildi';
  const message =
    count > 1
      ? `"${group?.name ?? 'Guruh'}" guruhida ${count} ta jonli dars rejaga qo'shildi.`
      : `"${group?.name ?? 'Guruh'}" guruhida yangi jonli dars rejaga qo'shildi.`;
  await prisma.notification.createMany({
    data: memberIds.map((id) => ({
      recipientId: id,
      senderId: teacherId,
      type: 'live_session' as const,
      title,
      message,
      relatedCourseId: group?.courseId ?? null,
    })),
  });
}
