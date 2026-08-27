/**
 * Dars Q&A (savol-javob) bildirishnomalari.
 *
 * Dars sahifasidagi izoh oqimi endi talabaning o'qituvchiga savol berishning
 * ASOSIY yo'li. Kanal "javobsiz qolmasligi" uchun ikki tomonlama xabar zanjiri:
 *   - Talaba savol bersa   → kurs o'qituvchisi xabardor qilinadi.
 *   - O'qituvchi/admin javob bersa → shu mavzuda savol bergan talabalar xabardor qilinadi.
 *
 * Barchasi best-effort — chaqiruvchi (comments route) try/catch bilan o'raydi,
 * shuning uchun bildirishnoma xatosi izoh qoldirishni bloklamaydi.
 */

import { prisma } from '@/lib/prisma';

/** Xabar matni uchun qisqa ko'rinish (bir qatorli, cheklangan). */
function preview(text: string, max = 140): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/**
 * Talaba savol berganda kurs o'qituvchisini xabardor qiladi.
 * O'qituvchi o'z kursida o'zi izoh qoldirsa (teacherId === senderId) — o'tkazib yuboriladi.
 */
export async function notifyTeacherOfQuestion(params: {
  teacherId: string;
  studentId: string;
  courseId: string;
  topicId: string;
  topicTitle: string;
  body: string;
}): Promise<void> {
  const { teacherId, studentId, courseId, topicId, topicTitle, body } = params;
  if (!teacherId || teacherId === studentId) return;

  await prisma.notification.create({
    data: {
      recipientId: teacherId,
      senderId: studentId,
      type: 'course_update',
      title: `Yangi savol: ${topicTitle}`,
      message: preview(body),
      relatedCourseId: courseId,
      relatedEntityId: topicId,
    },
  });
}

/**
 * O'qituvchi/admin javob berganda shu mavzuda savol bergan TALABALARni xabardor qiladi.
 * Javob beruvchining o'zi va boshqa xodimlar (teacher/admin) chetlab o'tiladi.
 */
export async function notifyStudentsOfAnswer(params: {
  answererId: string;
  courseId: string;
  topicId: string;
  topicTitle: string;
  body: string;
}): Promise<void> {
  const { answererId, courseId, topicId, topicTitle, body } = params;

  // Shu mavzuda izoh qoldirgan boshqa foydalanuvchilar (noyob).
  const askers = await prisma.topicComment.findMany({
    where: { topicId, userId: { not: answererId } },
    select: { userId: true },
    distinct: ['userId'],
  });
  if (askers.length === 0) return;

  // Faqat talabalarga yuboramiz — boshqa o'qituvchi/adminlarni bezovta qilmaymiz.
  const students = await prisma.userProfile.findMany({
    where: { id: { in: askers.map((a) => a.userId) }, role: 'student' },
    select: { id: true },
  });
  if (students.length === 0) return;

  await prisma.notification.createMany({
    data: students.map((s) => ({
      recipientId: s.id,
      senderId: answererId,
      type: 'course_update' as const,
      title: `Savolingizga javob: ${topicTitle}`,
      message: preview(body),
      relatedCourseId: courseId,
      relatedEntityId: topicId,
    })),
  });
}
