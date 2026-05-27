/**
 * Repository barrel — namespace imports uchun.
 *
 * Foydalanish:
 *   import { enrollmentRepo, topicRepo } from '@/lib/repositories';
 *   await enrollmentRepo.findByStudentAndCourse(...);
 */

export * as enrollmentRepo from './enrollment.repository';
export * as courseRepo from './course.repository';
export * as topicRepo from './topic.repository';
export * as topicCompletionRepo from './topic-completion.repository';
export * as activityRepo from './activity.repository';
export * as certificateRepo from './certificate.repository';
export * as categoryRepo from './category.repository';

// Type re-exports
export type {
  EnrollmentBasic,
  EnrollmentWithCourse,
} from './enrollment.repository';
export type { CourseWithCategoryAndTeacher } from './course.repository';
export type { StudentCertificateRow } from './certificate.repository';
