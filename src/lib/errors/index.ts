/**
 * Service-layer custom errors.
 *
 * Service'lar `throw` qiladi, route handler'lar catch qilib HTTP status'ga
 * o'tkazadi. `code` field machine-readable identifier sifatida ishlatiladi.
 */

export class ServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = new.target.name;
    // V8 stack capture
    if (typeof (Error as any).captureStackTrace === 'function') {
      (Error as any).captureStackTrace(this, new.target);
    }
  }
}

export class EnrollmentNotFoundError extends ServiceError {
  constructor(studentId: string, courseId: string) {
    super(
      `Enrollment not found for student ${studentId} in course ${courseId}`,
      'ENROLLMENT_NOT_FOUND',
    );
  }
}

export class TopicNotFoundError extends ServiceError {
  constructor(topicId: string) {
    super(`Topic not found: ${topicId}`, 'TOPIC_NOT_FOUND');
  }
}

export class CourseNotFoundError extends ServiceError {
  constructor(courseId: string) {
    super(`Course not found: ${courseId}`, 'COURSE_NOT_FOUND');
  }
}

export class UserNotFoundError extends ServiceError {
  constructor(userId: string) {
    super(`User not found: ${userId}`, 'USER_NOT_FOUND');
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message = 'Autentifikatsiya talab qilinadi') {
    super(message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message = "Bu amal uchun ruxsat yo'q") {
    super(message, 'FORBIDDEN');
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
  }
}

/** Admin o'zini suspend/role change qilmoqchi bo'lsa */
export class SelfActionError extends ServiceError {
  constructor() {
    super("O'z hisobingizga bu amalni qo'llab bo'lmaydi", 'SELF_ACTION_NOT_ALLOWED');
  }
}

/** Oxirgi admin role'ini o'zgartirmoqchi yoki suspend qilmoqchi bo'lsa */
export class LastAdminError extends ServiceError {
  constructor() {
    super("Oxirgi adminni o'zgartirib bo'lmaydi", 'LAST_ADMIN_PROTECTED');
  }
}

/** Type guard — route handler'larda ishlatish uchun */
export function isServiceError(err: unknown): err is ServiceError {
  return err instanceof ServiceError;
}
