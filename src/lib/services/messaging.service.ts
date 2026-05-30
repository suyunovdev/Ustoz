/**
 * Direct Messaging Service
 * ------------------------
 * Teacher ↔ Student 1-1 yozishmalar.
 *
 * Access qoidalari:
 *   - Teacher conversation ochishi mumkin faqat o'z kursiga yozilgan talaba bilan
 *   - Student conversation ochishi mumkin faqat o'zi yozilgan kurs teacher'i bilan
 *   - Message yuborish/o'qish — faqat thread ishtirokchilari
 */

import { conversationRepo, type Side } from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export class ConversationNotFoundError extends Error {
  code = 'CONVERSATION_NOT_FOUND';
  constructor() {
    super("Suhbat topilmadi");
    this.name = 'ConversationNotFoundError';
  }
}

export class NotParticipantError extends Error {
  code = 'NOT_PARTICIPANT';
  constructor() {
    super("Bu suhbatda ishtirokchi emassiz");
    this.name = 'NotParticipantError';
  }
}

export class CannotStartConversationError extends Error {
  code = 'CANNOT_START_CONVERSATION';
  constructor() {
    super(
      "Suhbat ocha olmaysiz — talaba kurslaringizga yozilgan emas yoki teacher sizning kurs egasi emas",
    );
    this.name = 'CannotStartConversationError';
  }
}

const MAX_BODY_LENGTH = 4000;

function validateBody(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length === 0) throw new ValidationError("Xabar bo'sh");
  if (trimmed.length > MAX_BODY_LENGTH) {
    throw new ValidationError(`Xabar ${MAX_BODY_LENGTH} belgidan oshmasin`);
  }
  return trimmed;
}

/**
 * Inbox ro'yxati — viewer roli avtomatik aniqlanadi (teacher yoki student).
 */
export async function listInbox(userId: string, role: string) {
  const side: Side = role === 'teacher' ? 'teacher' : 'student';
  return conversationRepo.listConversations(userId, side);
}

export async function getInboxUnreadCount(userId: string, role: string) {
  const side: Side = role === 'teacher' ? 'teacher' : 'student';
  return conversationRepo.getTotalUnreadCount(userId, side);
}

export async function getConversationForUser(conversationId: string, userId: string) {
  const conv = await conversationRepo.findConversationForUser(conversationId, userId);
  if (!conv) throw new ConversationNotFoundError();
  return conv;
}

export async function listConversationMessages(
  conversationId: string,
  userId: string,
  beforeId?: string,
) {
  const conv = await conversationRepo.findConversationForUser(conversationId, userId);
  if (!conv) throw new ConversationNotFoundError();
  const messages = await conversationRepo.listMessages(conversationId, 100, beforeId);
  // Avtomatik mark-as-read
  await conversationRepo.markAsRead(conversationId, userId);
  return { conversation: conv, messages };
}

/**
 * Teacher tomonidan thread ochish — talaba teacher'ning kursiga yozilgan bo'lishi shart.
 */
export async function ensureConversationFromTeacher(
  teacherId: string,
  studentId: string,
  courseId?: string,
) {
  // Talaba teacher kursiga yozilganligini tekshirish
  const enrolled = await prisma.enrollment.findFirst({
    where: { studentId, course: { teacherId } },
    select: { id: true },
  });
  if (!enrolled) throw new CannotStartConversationError();
  return conversationRepo.getOrCreateConversation(teacherId, studentId, courseId);
}

/**
 * Student tomonidan thread ochish — student teacher'ning kursiga yozilgan bo'lishi shart.
 */
export async function ensureConversationFromStudent(
  studentId: string,
  teacherId: string,
  courseId?: string,
) {
  const enrolled = await prisma.enrollment.findFirst({
    where: { studentId, course: { teacherId } },
    select: { id: true },
  });
  if (!enrolled) throw new CannotStartConversationError();
  return conversationRepo.getOrCreateConversation(teacherId, studentId, courseId);
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  const validated = validateBody(body);
  try {
    return await conversationRepo.sendMessage(conversationId, senderId, validated);
  } catch (err: any) {
    if (err?.message === 'CONVERSATION_NOT_FOUND') throw new ConversationNotFoundError();
    if (err?.message === 'NOT_PARTICIPANT') throw new NotParticipantError();
    throw err;
  }
}

export async function markAsRead(conversationId: string, userId: string) {
  return conversationRepo.markAsRead(conversationId, userId);
}
