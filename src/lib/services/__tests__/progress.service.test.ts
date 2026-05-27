/**
 * progress.service.ts — unit testlar.
 *
 * Repository va prisma client to'liq mock'langan — DB'ga ulanmaydi.
 * Faqat service biznes logikasi sinaladi.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Repository barrel'ni mock — service shu yerdan import qiladi.
vi.mock('@/lib/repositories', () => ({
  enrollmentRepo: {
    findByStudentAndCourse: vi.fn(),
    updateProgress: vi.fn(),
  },
  topicRepo: {
    findById: vi.fn(),
    findByCourse: vi.fn(),
    countByCourse: vi.fn(),
  },
  topicCompletionRepo: {
    findByStudentAndTopic: vi.fn(),
    create: vi.fn(),
    countByStudentAndCourse: vi.fn(),
    getCompletedTopicIds: vi.fn(),
  },
  activityRepo: {
    upsertForToday: vi.fn(),
  },
}));

// Prisma client — $transaction faqat callback'ni darhol chaqiradi.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(async (cb: (tx: unknown) => unknown) => cb({})),
  },
}));

import {
  calculateCourseProgress,
  markTopicComplete,
  getNextTopic,
} from '../progress.service';
import {
  enrollmentRepo,
  topicRepo,
  topicCompletionRepo,
  activityRepo,
} from '@/lib/repositories';
import { EnrollmentNotFoundError, TopicNotFoundError } from '@/lib/errors';

const STUDENT_ID = 'student-1';
const COURSE_ID = 'course-1';
const TOPIC_ID = 'topic-1';
const ENROLLMENT_ID = 'enroll-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('calculateCourseProgress', () => {
  it('total === 0 bo\'lsa 0 qaytaradi (edge case)', async () => {
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(0);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(0);

    const result = await calculateCourseProgress(STUDENT_ID, COURSE_ID);
    expect(result).toBe(0);
  });

  it('hech qanday topic tugatilmagan → 0%', async () => {
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(10);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(0);

    const result = await calculateCourseProgress(STUDENT_ID, COURSE_ID);
    expect(result).toBe(0);
  });

  it('yarmi tugatilgan → 50%', async () => {
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(10);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(5);

    const result = await calculateCourseProgress(STUDENT_ID, COURSE_ID);
    expect(result).toBe(50);
  });

  it('hammasi tugatilgan → 100%', async () => {
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(7);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(7);

    const result = await calculateCourseProgress(STUDENT_ID, COURSE_ID);
    expect(result).toBe(100);
  });

  it('yaxlitlash to\'g\'ri (1/3 → 33)', async () => {
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(3);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(1);

    const result = await calculateCourseProgress(STUDENT_ID, COURSE_ID);
    expect(result).toBe(33);
  });
});

describe('markTopicComplete', () => {
  const baseEnrollment = {
    id: ENROLLMENT_ID,
    studentId: STUDENT_ID,
    courseId: COURSE_ID,
    progress: 0,
    completedAt: null,
  };

  it('topic topilmasa TopicNotFoundError tashlaydi', async () => {
    vi.mocked(topicRepo.findById).mockResolvedValue(null);

    await expect(markTopicComplete(STUDENT_ID, TOPIC_ID)).rejects.toThrow(
      TopicNotFoundError,
    );
  });

  it('enrollment topilmasa EnrollmentNotFoundError tashlaydi', async () => {
    vi.mocked(topicRepo.findById).mockResolvedValue({
      id: TOPIC_ID,
      courseId: COURSE_ID,
    } as any);
    vi.mocked(enrollmentRepo.findByStudentAndCourse).mockResolvedValue(null);

    await expect(markTopicComplete(STUDENT_ID, TOPIC_ID)).rejects.toThrow(
      EnrollmentNotFoundError,
    );
  });

  it('birinchi marta tugatilganda: completion + activity yaratiladi', async () => {
    vi.mocked(topicRepo.findById).mockResolvedValue({
      id: TOPIC_ID,
      courseId: COURSE_ID,
    } as any);
    vi.mocked(enrollmentRepo.findByStudentAndCourse).mockResolvedValue(
      baseEnrollment as any,
    );
    vi.mocked(topicCompletionRepo.findByStudentAndTopic).mockResolvedValue(null);
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(4);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(1);

    const result = await markTopicComplete(STUDENT_ID, TOPIC_ID);

    expect(topicCompletionRepo.create).toHaveBeenCalledOnce();
    expect(activityRepo.upsertForToday).toHaveBeenCalledOnce();
    expect(enrollmentRepo.updateProgress).toHaveBeenCalledOnce();
    expect(result.wasAlreadyCompleted).toBe(false);
    expect(result.progress).toBe(25);
    expect(result.isCourseCompleted).toBe(false);
  });

  it('idempotency: takroriy chaqirilganda completion va activity yaratilmaydi', async () => {
    vi.mocked(topicRepo.findById).mockResolvedValue({
      id: TOPIC_ID,
      courseId: COURSE_ID,
    } as any);
    vi.mocked(enrollmentRepo.findByStudentAndCourse).mockResolvedValue({
      ...baseEnrollment,
      progress: 25,
    } as any);
    vi.mocked(topicCompletionRepo.findByStudentAndTopic).mockResolvedValue({
      id: 'tc-existing',
    });
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(4);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(1);

    const result = await markTopicComplete(STUDENT_ID, TOPIC_ID);

    expect(topicCompletionRepo.create).not.toHaveBeenCalled();
    expect(activityRepo.upsertForToday).not.toHaveBeenCalled();
    expect(result.wasAlreadyCompleted).toBe(true);
    expect(result.progress).toBe(25);
  });

  it('kurs 100% tugatilganda isCourseCompleted=true va completedAt o\'rnatiladi', async () => {
    vi.mocked(topicRepo.findById).mockResolvedValue({
      id: TOPIC_ID,
      courseId: COURSE_ID,
    } as any);
    vi.mocked(enrollmentRepo.findByStudentAndCourse).mockResolvedValue({
      ...baseEnrollment,
      progress: 75,
    } as any);
    vi.mocked(topicCompletionRepo.findByStudentAndTopic).mockResolvedValue(null);
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(4);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(4);

    const result = await markTopicComplete(STUDENT_ID, TOPIC_ID);

    expect(result.isCourseCompleted).toBe(true);
    expect(result.progress).toBe(100);

    const updateCall = vi.mocked(enrollmentRepo.updateProgress).mock.calls[0];
    expect(updateCall[1]).toMatchObject({ progress: 100 });
    expect((updateCall[1] as any).completedAt).toBeInstanceOf(Date);
  });

  it('kurs allaqachon tugatilgan bo\'lsa isCourseCompleted=false', async () => {
    vi.mocked(topicRepo.findById).mockResolvedValue({
      id: TOPIC_ID,
      courseId: COURSE_ID,
    } as any);
    vi.mocked(enrollmentRepo.findByStudentAndCourse).mockResolvedValue({
      ...baseEnrollment,
      progress: 100,
      completedAt: new Date('2026-01-01'),
    } as any);
    vi.mocked(topicCompletionRepo.findByStudentAndTopic).mockResolvedValue({
      id: 'tc-existing',
    });
    vi.mocked(topicRepo.countByCourse).mockResolvedValue(4);
    vi.mocked(topicCompletionRepo.countByStudentAndCourse).mockResolvedValue(4);

    const result = await markTopicComplete(STUDENT_ID, TOPIC_ID);

    expect(result.isCourseCompleted).toBe(false);
    expect(result.wasAlreadyCompleted).toBe(true);
  });
});

describe('getNextTopic', () => {
  it('birinchi tugatilmagan topic\'ni qaytaradi', async () => {
    vi.mocked(topicRepo.findByCourse).mockResolvedValue([
      { id: 't1', title: 'Intro', orderIndex: 0, courseId: COURSE_ID } as any,
      { id: 't2', title: 'Basics', orderIndex: 1, courseId: COURSE_ID } as any,
      { id: 't3', title: 'Advanced', orderIndex: 2, courseId: COURSE_ID } as any,
    ]);
    vi.mocked(topicCompletionRepo.getCompletedTopicIds).mockResolvedValue(
      new Set(['t1']),
    );

    const next = await getNextTopic(STUDENT_ID, COURSE_ID);
    expect(next).toMatchObject({ id: 't2', title: 'Basics', orderIndex: 1 });
  });

  it('hammasi tugatilgan bo\'lsa null qaytaradi', async () => {
    vi.mocked(topicRepo.findByCourse).mockResolvedValue([
      { id: 't1', title: 'Intro', orderIndex: 0, courseId: COURSE_ID } as any,
    ]);
    vi.mocked(topicCompletionRepo.getCompletedTopicIds).mockResolvedValue(
      new Set(['t1']),
    );

    const next = await getNextTopic(STUDENT_ID, COURSE_ID);
    expect(next).toBeNull();
  });

  it('topic ro\'yxati bo\'sh bo\'lsa null qaytaradi', async () => {
    vi.mocked(topicRepo.findByCourse).mockResolvedValue([]);
    vi.mocked(topicCompletionRepo.getCompletedTopicIds).mockResolvedValue(
      new Set(),
    );

    const next = await getNextTopic(STUDENT_ID, COURSE_ID);
    expect(next).toBeNull();
  });
});
