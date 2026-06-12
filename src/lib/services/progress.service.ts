/**
 * Progress Service
 * ----------------
 * Student'ning kurs progress'ini hisoblash va yangilash uchun yagona joy.
 *
 * Source of truth: `topic_completions` jadvali.
 * Cached value: `enrollments.progress` (0-100) — har topic complete bo'lganda yangilanadi.
 *
 * Repository layer orqali Prisma'ga ulanadi (test qilish uchun mock'lash oson).
 * Transaction'lar: `prisma.$transaction` ichida tx repository funksiyalariga uzatiladi.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';
import {
  enrollmentRepo,
  topicRepo,
  topicCompletionRepo,
  activityRepo,
} from '@/lib/repositories';
import { EnrollmentNotFoundError, TopicNotFoundError } from '@/lib/errors';
import { maybeAutoIssue } from './certificate.service';

// TODO: pino logger — hozircha console.log
const log = (event: string, payload?: Record<string, unknown>) => {
  // eslint-disable-next-line no-console
  console.log(`[progress.service] ${event}`, payload ?? {});
};

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Bitta kursdagi student progress'ini foiz sifatida hisoblaydi.
 *
 *   completed = topic_completions WHERE student=X AND course=Y count
 *   total     = course_topics WHERE course=Y count
 *   return Math.round((completed / total) * 100)
 *
 * Edge case: total === 0 → 0 qaytaradi.
 */
export async function calculateCourseProgress(
  studentId: string,
  courseId: string,
  tx?: Prisma.TransactionClient,
): Promise<number> {
  log('calculateCourseProgress:start', { studentId, courseId });

  const [totalTopics, completed] = await Promise.all([
    topicRepo.countByCourse(courseId, tx),
    topicCompletionRepo.countByStudentAndCourse(studentId, courseId, tx),
  ]);

  if (totalTopics === 0) {
    log('calculateCourseProgress:end', { result: 0, reason: 'no_topics' });
    return 0;
  }

  const result = Math.round((completed / totalTopics) * 100);
  log('calculateCourseProgress:end', { totalTopics, completed, result });
  return result;
}

/**
 * Topic'ni tugatilgan deb belgilaydi va Enrollment.progress'ni yangilaydi.
 *
 * Atomic operation (bitta transaction):
 *   1. CourseTopic.findUnique → courseId
 *   2. Enrollment.findUnique → studentId+courseId
 *   3. TopicCompletion.findUnique → idempotency check
 *   4. TopicCompletion.create + StudentActivity.upsert (faqat yangi bo'lsa)
 *   5. calculateCourseProgress (tx client bilan)
 *   6. Enrollment.update — progress + lastAccessedAt
 */
export async function markTopicComplete(
  studentId: string,
  topicId: string,
): Promise<{
  progress: number;
  isCourseCompleted: boolean;
  wasAlreadyCompleted: boolean;
}> {
  log('markTopicComplete:start', { studentId, topicId });

  const result = await prisma.$transaction(async (tx) => {
    // 1. Topic + courseId
    const topic = await topicRepo.findById(topicId, tx);
    if (!topic) throw new TopicNotFoundError(topicId);
    const { courseId } = topic;

    // 2. Enrollment tekshirish
    const enrollment = await enrollmentRepo.findByStudentAndCourse(studentId, courseId, tx);
    if (!enrollment) throw new EnrollmentNotFoundError(studentId, courseId);

    // 3. Idempotency — avval tugatilganmi?
    const existing = await topicCompletionRepo.findByStudentAndTopic(studentId, topicId, tx);
    const wasAlreadyCompleted = existing !== null;

    // 4. Yangi bo'lsa: completion + activity (idempotent)
    if (!wasAlreadyCompleted) {
      await topicCompletionRepo.create({ studentId, topicId, courseId }, tx);
      await activityRepo.upsertForToday(studentId, tx);
    }

    // 5. Yangi progress hisoblash (tx ichida — yangi qo'shilgan completion'ni ko'radi)
    const progress = await calculateCourseProgress(studentId, courseId, tx);

    // 6. Kurs tugatildi deb belgilash kerakmi?
    const isCourseCompleted = progress === 100 && enrollment.completedAt === null;

    // 7. Enrollment'ni yangilash — progress + lastAccessedAt
    if (progress !== enrollment.progress || isCourseCompleted || !wasAlreadyCompleted) {
      await enrollmentRepo.updateProgress(
        enrollment.id,
        {
          progress,
          lastAccessedAt: new Date(),
          ...(isCourseCompleted ? { completedAt: new Date() } : {}),
        },
        tx,
      );
    }

    return { progress, isCourseCompleted, wasAlreadyCompleted, courseId };
  });

  log('markTopicComplete:end', result);

  // Kurs birinchi marta 100% tugaganda — sertifikat avtomatik berish.
  // Transaction'dan tashqarida chaqiramiz (idempotent, alohida xato bo'lsa progress saqlanadi).
  if (result.isCourseCompleted) {
    try {
      const cert = await maybeAutoIssue(studentId, result.courseId);
      if (cert) {
        log('markTopicComplete:certificate_issued', {
          certificateId: cert.id,
          number: cert.certificateNumber,
          created: cert.created,
        });
      }
    } catch (err) {
      // Sertifikat berishdagi xato progress'ni buzmasin — log qilamiz va davom etamiz.
      log('markTopicComplete:certificate_error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // Tashqi shartnomada courseId yo'q edi — uni qaytarmaymiz
  const { courseId: _omit, ...publicResult } = result;
  return publicResult;
}

/**
 * "Davom et" tugmasi uchun: keyingi tugatilmagan topic.
 */
export async function getNextTopic(
  studentId: string,
  courseId: string,
): Promise<{ id: string; title: string; orderIndex: number } | null> {
  log('getNextTopic:start', { studentId, courseId });

  const [topics, completedIds] = await Promise.all([
    topicRepo.findByCourse(courseId),
    topicCompletionRepo.getCompletedTopicIds(studentId, courseId),
  ]);

  const next = topics.find((t) => !completedIds.has(t.id)) ?? null;
  log('getNextTopic:end', { topicsTotal: topics.length, found: next?.id ?? null });
  return next;
}

/**
 * UI'da har topic uchun "tugatildi/tugatilmagan" belgisi (O(1) lookup).
 */
export async function getCompletedTopicIds(
  studentId: string,
  courseId: string,
): Promise<Set<string>> {
  log('getCompletedTopicIds:start', { studentId, courseId });
  const set = await topicCompletionRepo.getCompletedTopicIds(studentId, courseId);
  log('getCompletedTopicIds:end', { count: set.size });
  return set;
}
