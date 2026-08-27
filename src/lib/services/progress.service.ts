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

// Silent in production — replace with structured logger when needed
const log = (_event: string, _payload?: Record<string, unknown>) => {
  // no-op
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
 * Kursning BARCHA enrollment'lari uchun cached progress'ni qayta hisoblaydi.
 * Mavzu qo'shilganda/o'chirilganda chaqiriladi — aks holda mavjud talabalarning
 * `enrollment.progress`/`completedAt` eskirib qoladi (masalan, mavzu qo'shilsa
 * 100% bo'lgan talaba hamon 100% ko'rinardi). Sertifikat AVTO-berilmaydi.
 */
export async function recomputeEnrollmentsForCourse(courseId: string): Promise<void> {
  const total = await topicRepo.countByCourse(courseId);
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    select: { id: true, studentId: true, progress: true, completedAt: true },
  });
  if (enrollments.length === 0) return;

  // Har talabaning tugatgan mavzular sonini BITTA groupBy so'rovida olamiz
  // (ilgari har enrollment uchun alohida count → N+1, mashhur kursda timeout xavfi).
  const grouped = await prisma.topicCompletion.groupBy({
    by: ['studentId'],
    where: { courseId },
    _count: { _all: true },
  });
  const completedByStudent = new Map<string, number>(
    grouped.map((g) => [g.studentId, g._count._all]),
  );

  // O'zgargan enrollment'larni yig'ib, bitta transaction'da yangilaymiz.
  const updates: Prisma.PrismaPromise<unknown>[] = [];
  // Sertifikat holatini progress bilan sinxronlash uchun (C3):
  //   progress 100 dan pastga tushsa → auto-sertifikatni SUSPEND
  //   progress qayta 100 ga chiqsa   → suspend qilingan auto-sertifikatni REINSTATE
  // Aks holda mavzu qo'shilganda talaba tugatmagan kursga amaldagi sertifikat qoladi.
  const suspendStudentIds: string[] = [];
  const reinstateStudentIds: string[] = [];
  for (const e of enrollments) {
    const completed = completedByStudent.get(e.studentId) ?? 0;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    const completedAt = progress === 100 ? (e.completedAt ?? new Date()) : null;
    // Date'larni qiymat bo'yicha solishtiramiz (ilgari reference bo'yicha edi →
    // har safar keraksiz update qilardi).
    const sameCompletedAt = (completedAt?.getTime() ?? null) === (e.completedAt?.getTime() ?? null);
    if (progress !== e.progress || !sameCompletedAt) {
      updates.push(
        prisma.enrollment.update({ where: { id: e.id }, data: { progress, completedAt } }),
      );
    }
    if (progress < 100) suspendStudentIds.push(e.studentId);
    else reinstateStudentIds.push(e.studentId);
  }

  // Suspend/reinstate — faqat AVTO berilgan sertifikatlarga ta'sir qiladi;
  // qo'lda revoke qilingan (status='revoked') sertifikat sticky bo'lib qoladi.
  if (suspendStudentIds.length > 0) {
    updates.push(
      prisma.certificate.updateMany({
        where: { courseId, studentId: { in: suspendStudentIds }, status: 'active', issueSource: 'auto' },
        data: { status: 'suspended' },
      }),
    );
  }
  if (reinstateStudentIds.length > 0) {
    updates.push(
      prisma.certificate.updateMany({
        where: { courseId, studentId: { in: reinstateStudentIds }, status: 'suspended', issueSource: 'auto' },
        data: { status: 'active' },
      }),
    );
  }

  if (updates.length > 0) await prisma.$transaction(updates);
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

    // 3+4. Idempotent yaratish — `createIfNew` ON CONFLICT DO NOTHING ishlatadi,
    //      shuning uchun bir vaqtda kelgan ikkinchi so'rov P2002 tashlab 500
    //      bermaydi, balki `false` (allaqachon mavjud) qaytaradi.
    const created = await topicCompletionRepo.createIfNew({ studentId, topicId, courseId }, tx);
    const wasAlreadyCompleted = !created;

    // Faoliyat (streak) — faqat haqiqatan yangi completion bo'lsa
    if (created) {
      await activityRepo.upsertForToday(studentId, tx);
    }

    // 5. Yangi progress hisoblash (tx ichida — yangi qo'shilgan completion'ni ko'radi)
    const progress = await calculateCourseProgress(studentId, courseId, tx);

    // 6. Kurs tugatildi deb belgilash kerakmi?
    const isCourseCompleted = progress === 100 && enrollment.completedAt === null;

    // 7. Enrollment'ni yangilash — progress + lastAccessedAt.
    //    completedAt: 100% da o'rnatiladi; progress past tushsa TOZALANADI
    //    (sticky bo'lib qolmasin — aks holda sertifikat huquqi noto'g'ri saqlanadi).
    const completedAt = progress === 100 ? (enrollment.completedAt ?? new Date()) : null;
    if (
      progress !== enrollment.progress ||
      !wasAlreadyCompleted ||
      completedAt !== enrollment.completedAt
    ) {
      await enrollmentRepo.updateProgress(
        enrollment.id,
        { progress, lastAccessedAt: new Date(), completedAt },
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
