/**
 * Teacher → Student management service.
 *
 * Imkoniyatlar:
 *   - O'qituvchining barcha kurslariga yozilgan talabalar ro'yxati
 *   - Talaba bo'yicha to'liq profil
 *   - Enrollment'ni faollashtirish/o'chirish
 *   - Talabaga bildirishnoma yuborish (individual / kurs bo'yicha)
 */

import { studentRepo, type StudentDetailRow } from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export class StudentNotFoundError extends Error {
  code = 'STUDENT_NOT_FOUND';
  constructor() {
    super("Talaba topilmadi yoki sizning kurslaringizga yozilmagan");
    this.name = 'StudentNotFoundError';
  }
}

export class EnrollmentAccessDeniedError extends Error {
  code = 'ENROLLMENT_ACCESS_DENIED';
  constructor() {
    super("Bu enrollment sizniki emas");
    this.name = 'EnrollmentAccessDeniedError';
  }
}

export async function listStudents(
  teacherId: string,
  filters: { courseId?: string; search?: string; activeOnly?: boolean } = {},
) {
  return studentRepo.listTeacherStudents(teacherId, filters);
}

export async function getStudentDetail(
  studentId: string,
  teacherId: string,
): Promise<StudentDetailRow> {
  const detail = await studentRepo.getStudentDetailForTeacher(studentId, teacherId);
  if (!detail) throw new StudentNotFoundError();
  return detail;
}

export async function setEnrollmentActive(
  enrollmentId: string,
  teacherId: string,
  isActive: boolean,
) {
  const access = await studentRepo.isEnrollmentOwner(enrollmentId, teacherId);
  if (!access.ok) throw new EnrollmentAccessDeniedError();
  return studentRepo.setEnrollmentActive(enrollmentId, isActive);
}

export async function removeEnrollment(
  enrollmentId: string,
  teacherId: string,
): Promise<void> {
  const access = await studentRepo.isEnrollmentOwner(enrollmentId, teacherId);
  if (!access.ok) throw new EnrollmentAccessDeniedError();
  await studentRepo.deleteEnrollment(enrollmentId);
}

export interface NotifyStudentInput {
  title: string;
  message: string;
  courseId?: string | null;
}

export async function notifyStudent(
  studentId: string,
  teacherId: string,
  input: NotifyStudentInput,
) {
  // Talaba teacher'ning kurslariga yozilganmi
  const enrolled = await prisma.enrollment.findFirst({
    where: { studentId, course: { teacherId } },
    select: { id: true },
  });
  if (!enrolled) throw new StudentNotFoundError();

  const title = input.title.trim();
  const message = input.message.trim();
  if (title.length < 2) throw new ValidationError("Sarlavha kamida 2 belgi");
  if (title.length > 200) throw new ValidationError("Sarlavha 200 belgidan oshmasin");
  if (message.length < 2) throw new ValidationError("Xabar kamida 2 belgi");
  if (message.length > 2000) throw new ValidationError("Xabar 2000 belgidan oshmasin");

  // Agar courseId berilgan bo'lsa, teacher uniki ekanligi tekshiriladi
  if (input.courseId) {
    const c = await prisma.course.findUnique({
      where: { id: input.courseId },
      select: { teacherId: true },
    });
    if (!c || c.teacherId !== teacherId) {
      throw new ValidationError("Bu kurs sizniki emas");
    }
  }

  return studentRepo.sendNotification({
    recipientId: studentId,
    senderId: teacherId,
    title,
    message,
    relatedCourseId: input.courseId ?? null,
  });
}

/**
 * Bulk notify — kurs bo'yicha barcha talabalarga.
 * activeOnly=true → faqat faol enrollment'lar.
 */
export async function broadcastToCourse(
  courseId: string,
  teacherId: string,
  input: NotifyStudentInput,
  options: { activeOnly?: boolean } = {},
): Promise<{ sent: number }> {
  const c = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  if (!c || c.teacherId !== teacherId) {
    throw new ValidationError("Bu kurs sizniki emas");
  }

  const title = input.title.trim();
  const message = input.message.trim();
  if (title.length < 2) throw new ValidationError("Sarlavha kamida 2 belgi");
  if (message.length < 2) throw new ValidationError("Xabar kamida 2 belgi");

  const where: any = { courseId };
  if (options.activeOnly) where.isActive = true;

  const recipients = await prisma.enrollment.findMany({
    where,
    select: { studentId: true },
  });

  if (recipients.length === 0) return { sent: 0 };

  await prisma.notification.createMany({
    data: recipients.map((r) => ({
      recipientId: r.studentId,
      senderId: teacherId,
      type: 'course_update' as const,
      title,
      message,
      relatedCourseId: courseId,
    })),
  });

  return { sent: recipients.length };
}
