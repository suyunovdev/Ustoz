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

/** Type guard — route handler'larda ishlatish uchun */
export function isServiceError(err: unknown): err is ServiceError {
  return err instanceof ServiceError;
}
