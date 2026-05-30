/**
 * Conversation + DirectMessage repository.
 *
 * 1-1 yozishmalar (teacher ↔ student).
 *   - Bitta juftlik uchun bitta thread (unique constraint)
 *   - Unread counts denormalized — inbox tez render bo'lishi uchun
 *   - Last message preview saqlanadi (so'nggi 200 belgi)
 */

import { prisma } from '@/lib/prisma';

const PREVIEW_LENGTH = 200;

export interface ConversationListItemRow {
  id: string;
  teacherId: string;
  studentId: string;
  courseId: string | null;
  courseTitle: string | null;
  lastMessageAt: Date;
  lastMessagePreview: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
  /** Hamkor (qarama-qarshi tomon) ma'lumotlari */
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerAvatarUrl: string | null;
  partnerRole: string;
}

export type Side = 'teacher' | 'student';

/**
 * Foydalanuvchi uchun inbox — barcha conversations (so'nggi xabar bo'yicha sort).
 */
export async function listConversations(
  userId: string,
  side: Side,
): Promise<ConversationListItemRow[]> {
  const where =
    side === 'teacher' ? { teacherId: userId } : { studentId: userId };

  const rows = await prisma.conversation.findMany({
    where,
    include: {
      teacher: {
        select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
      },
      student: {
        select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
      },
      course: { select: { title: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 100,
  });

  return rows.map((c) => {
    const partner = side === 'teacher' ? c.student : c.teacher;
    return {
      id: c.id,
      teacherId: c.teacherId,
      studentId: c.studentId,
      courseId: c.courseId,
      courseTitle: c.course?.title ?? null,
      lastMessageAt: c.lastMessageAt,
      lastMessagePreview: c.lastMessagePreview,
      lastMessageSenderId: c.lastMessageSenderId,
      unreadCount: side === 'teacher' ? c.teacherUnreadCount : c.studentUnreadCount,
      partnerId: partner.id,
      partnerName: partner.fullName,
      partnerEmail: partner.email,
      partnerAvatarUrl: partner.avatarUrl,
      partnerRole: partner.role,
    };
  });
}

export interface ConversationDetailRow {
  id: string;
  teacherId: string;
  studentId: string;
  courseId: string | null;
  courseTitle: string | null;
  partner: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: string;
  };
  teacherUnreadCount: number;
  studentUnreadCount: number;
  createdAt: Date;
}

export async function findConversationForUser(
  conversationId: string,
  userId: string,
): Promise<ConversationDetailRow | null> {
  const c = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      teacher: {
        select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
      },
      student: {
        select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
      },
      course: { select: { title: true } },
    },
  });
  if (!c) return null;
  const isTeacher = c.teacherId === userId;
  const isStudent = c.studentId === userId;
  if (!isTeacher && !isStudent) return null;
  const partner = isTeacher ? c.student : c.teacher;
  return {
    id: c.id,
    teacherId: c.teacherId,
    studentId: c.studentId,
    courseId: c.courseId,
    courseTitle: c.course?.title ?? null,
    partner,
    teacherUnreadCount: c.teacherUnreadCount,
    studentUnreadCount: c.studentUnreadCount,
    createdAt: c.createdAt,
  };
}

export interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
}

export async function listMessages(
  conversationId: string,
  limit = 100,
  beforeId?: string,
): Promise<MessageRow[]> {
  const where: any = { conversationId };
  if (beforeId) where.id = { lt: beforeId };
  // Eski → yangi
  const rows = await prisma.directMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.reverse();
}

/**
 * Get-or-create conversation (1-1 teacher ↔ student).
 */
export async function getOrCreateConversation(
  teacherId: string,
  studentId: string,
  courseId?: string | null,
): Promise<ConversationDetailRow> {
  let conv = await prisma.conversation.findUnique({
    where: { teacherId_studentId: { teacherId, studentId } },
    include: {
      teacher: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
      student: { select: { id: true, fullName: true, email: true, avatarUrl: true, role: true } },
      course: { select: { title: true } },
    },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: { teacherId, studentId, courseId: courseId ?? null },
      include: {
        teacher: {
          select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
        },
        student: {
          select: { id: true, fullName: true, email: true, avatarUrl: true, role: true },
        },
        course: { select: { title: true } },
      },
    });
  }

  // Caller perspektivasi noma'lum bo'lgani uchun teacher'ning partner = student
  return {
    id: conv.id,
    teacherId: conv.teacherId,
    studentId: conv.studentId,
    courseId: conv.courseId,
    courseTitle: conv.course?.title ?? null,
    partner: conv.student,
    teacherUnreadCount: conv.teacherUnreadCount,
    studentUnreadCount: conv.studentUnreadCount,
    createdAt: conv.createdAt,
  };
}

/**
 * Xabar yuborish — message create + conversation metadata yangilash atomik tarzda.
 *   - lastMessageAt → now
 *   - lastMessagePreview → trim
 *   - hamkor uchun unread+1
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
): Promise<MessageRow> {
  return prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.findUnique({
      where: { id: conversationId },
      select: { teacherId: true, studentId: true },
    });
    if (!conv) throw new Error('CONVERSATION_NOT_FOUND');
    if (conv.teacherId !== senderId && conv.studentId !== senderId) {
      throw new Error('NOT_PARTICIPANT');
    }

    const created = await tx.directMessage.create({
      data: { conversationId, senderId, body },
    });

    const isTeacherSender = conv.teacherId === senderId;
    const preview = body.slice(0, PREVIEW_LENGTH);

    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: created.createdAt,
        lastMessagePreview: preview,
        lastMessageSenderId: senderId,
        // Sender o'qigan, qarama-qarshi tomon unread+1
        ...(isTeacherSender
          ? { studentUnreadCount: { increment: 1 } }
          : { teacherUnreadCount: { increment: 1 } }),
      },
    });

    return created;
  });
}

/**
 * Foydalanuvchi suhbatni ochganda — uning unread count'i 0 ga tushadi,
 * va o'zga tomon yuborgan messages.readAt = now.
 */
export async function markAsRead(
  conversationId: string,
  userId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.findUnique({
      where: { id: conversationId },
      select: { teacherId: true, studentId: true },
    });
    if (!conv) return;
    const isTeacher = conv.teacherId === userId;
    const isStudent = conv.studentId === userId;
    if (!isTeacher && !isStudent) return;

    await tx.conversation.update({
      where: { id: conversationId },
      data: isTeacher
        ? { teacherUnreadCount: 0 }
        : { studentUnreadCount: 0 },
    });

    await tx.directMessage.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  });
}

export async function getTotalUnreadCount(
  userId: string,
  side: Side,
): Promise<number> {
  if (side === 'teacher') {
    const result = await prisma.conversation.aggregate({
      where: { teacherId: userId },
      _sum: { teacherUnreadCount: true },
    });
    return result._sum.teacherUnreadCount ?? 0;
  }
  const result = await prisma.conversation.aggregate({
    where: { studentId: userId },
    _sum: { studentUnreadCount: true },
  });
  return result._sum.studentUnreadCount ?? 0;
}
