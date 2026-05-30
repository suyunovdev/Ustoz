/**
 * Teacher course service — archive/delete/duplicate.
 *
 * Foydalanish: faqat o'z kursini boshqarish (teacher_id check repository ichida).
 */

import { teacherRepo, type TeacherCourseRow } from '@/lib/repositories';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';

export class CourseHasEnrollmentsError extends Error {
  code = 'COURSE_HAS_ENROLLMENTS';
  constructor() {
    super("Kurs talabalarga sotilgan — o'chirib bo'lmaydi (arxivlang)");
    this.name = 'CourseHasEnrollmentsError';
  }
}

export async function archiveCourse(
  courseId: string,
  teacherId: string,
): Promise<TeacherCourseRow> {
  const updated = await teacherRepo.updateArchiveStatus(courseId, teacherId, false);
  if (!updated) throw new CourseNotFoundError(courseId);
  return updated;
}

export async function unarchiveCourse(
  courseId: string,
  teacherId: string,
): Promise<TeacherCourseRow> {
  const updated = await teacherRepo.updateArchiveStatus(courseId, teacherId, true);
  if (!updated) throw new CourseNotFoundError(courseId);
  return updated;
}

export async function deleteCourse(
  courseId: string,
  teacherId: string,
): Promise<{ success: true }> {
  const result = await teacherRepo.deleteCourseSafe(courseId, teacherId);
  if (!result.deleted) {
    if (result.reason?.includes('topilmadi')) {
      throw new CourseNotFoundError(courseId);
    }
    throw new CourseHasEnrollmentsError();
  }
  return { success: true };
}

export async function duplicateCourse(
  courseId: string,
  teacherId: string,
): Promise<TeacherCourseRow> {
  const duplicated = await teacherRepo.duplicateCourse(courseId, teacherId);
  if (!duplicated) throw new CourseNotFoundError(courseId);
  return duplicated;
}

export async function getCourse(
  courseId: string,
  teacherId: string,
) {
  const course = await teacherRepo.findCourseByIdForTeacher(courseId, teacherId);
  if (!course) throw new CourseNotFoundError(courseId);
  return course;
}
