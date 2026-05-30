/**
 * Teacher Analytics Service
 * -------------------------
 * Global analytics (barcha kurslar bo'yicha) va per-course detail.
 *
 * Access control:
 *   - Global analytics: faqat teacher o'z ma'lumotini ko'radi
 *   - Course analytics: course teacher_id check
 */

import { analyticsRepo } from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export class CourseAccessDeniedError extends Error {
  code = 'COURSE_ACCESS_DENIED';
  constructor() {
    super("Bu kurs sizniki emas");
    this.name = 'CourseAccessDeniedError';
  }
}

export class CourseNotFoundError extends Error {
  code = 'COURSE_NOT_FOUND';
  constructor() {
    super("Kurs topilmadi");
    this.name = 'CourseNotFoundError';
  }
}

const VALID_DAY_RANGES = new Set([7, 14, 30, 60, 90, 180]);

export interface GlobalAnalyticsData {
  range: number;
  dailyRevenue: Array<{
    date: string;
    revenue: string;
    enrollments: number;
    payments: number;
  }>;
  comparison: {
    currentRevenue: string;
    previousRevenue: string;
    revenueDeltaPct: number | null;
    currentEnrollments: number;
    previousEnrollments: number;
    enrollmentsDeltaPct: number | null;
  };
  engagement: {
    totalMaterialViews: number;
    totalWatchHours: number;
    totalTopicCompletions: number;
    dailyActiveStudents: number;
    weeklyActiveStudents: number;
    monthlyActiveStudents: number;
  };
}

function pctDelta(curr: number, prev: number): number | null {
  if (prev === 0) return curr === 0 ? 0 : null;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export async function getGlobalAnalytics(
  teacherId: string,
  days: number,
): Promise<GlobalAnalyticsData> {
  if (!VALID_DAY_RANGES.has(days)) {
    throw new ValidationError("Range: 7, 14, 30, 60, 90 yoki 180 bo'lishi kerak");
  }

  const [daily, compare, engagement] = await Promise.all([
    analyticsRepo.getDailyRevenue(teacherId, days),
    analyticsRepo.compareRevenue(teacherId, days),
    analyticsRepo.getEngagement(teacherId),
  ]);

  return {
    range: days,
    dailyRevenue: daily.map((d) => ({
      date: d.date.toISOString().slice(0, 10),
      revenue: d.revenue.toString(),
      enrollments: d.enrollments,
      payments: d.payments,
    })),
    comparison: {
      currentRevenue: compare.currentRevenue.toString(),
      previousRevenue: compare.previousRevenue.toString(),
      revenueDeltaPct: pctDelta(
        Number(compare.currentRevenue),
        Number(compare.previousRevenue),
      ),
      currentEnrollments: compare.currentEnrollments,
      previousEnrollments: compare.previousEnrollments,
      enrollmentsDeltaPct: pctDelta(compare.currentEnrollments, compare.previousEnrollments),
    },
    engagement: {
      totalMaterialViews: engagement.totalMaterialViews,
      totalWatchHours: Math.round(engagement.totalWatchSec / 3600),
      totalTopicCompletions: engagement.totalTopicCompletions,
      dailyActiveStudents: engagement.dailyActiveStudents,
      weeklyActiveStudents: engagement.weeklyActiveStudents,
      monthlyActiveStudents: engagement.monthlyActiveStudents,
    },
  };
}

// ==================== PER-COURSE ====================

async function assertCourseOwner(courseId: string, teacherId: string) {
  const c = await prisma.course.findUnique({
    where: { id: courseId },
    select: { teacherId: true },
  });
  if (!c) throw new CourseNotFoundError();
  if (c.teacherId !== teacherId) throw new CourseAccessDeniedError();
}

export interface CourseAnalyticsData {
  course: {
    courseId: string;
    courseTitle: string;
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    avgProgress: number;
    totalRevenueUzs: string;
    totalRefundsUzs: string;
    reviewCount: number;
    avgRating: number;
  };
  topicFunnel: Array<{
    topicId: string;
    topicTitle: string;
    orderIndex: number;
    completions: number;
    completionRate: number;
  }>;
  topStudents: Array<{
    studentId: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    progress: number;
    lastAccessedAt: string | null;
  }>;
  strugglingStudents: Array<{
    studentId: string;
    fullName: string;
    email: string;
    progress: number;
    lastAccessedAt: string | null;
    daysSinceActivity: number | null;
  }>;
  testStats: Array<{
    testId: string;
    testTitle: string;
    status: string;
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    avgScore: number;
  }>;
  assignmentStats: Array<{
    assignmentId: string;
    title: string;
    status: string;
    submissionCount: number;
    gradedCount: number;
    lateCount: number;
    avgGrade: number;
    gradeRate: number;
  }>;
}

export async function getCourseAnalytics(
  courseId: string,
  teacherId: string,
): Promise<CourseAnalyticsData> {
  await assertCourseOwner(courseId, teacherId);

  const [course, funnel, top, struggling, tests, assignments] = await Promise.all([
    analyticsRepo.getCourseAnalytics(courseId),
    analyticsRepo.getTopicFunnel(courseId),
    analyticsRepo.getTopStudents(courseId, 10),
    analyticsRepo.getStrugglingStudents(courseId, 10),
    analyticsRepo.getCourseTestStats(courseId),
    analyticsRepo.getCourseAssignmentStats(courseId),
  ]);

  if (!course) throw new CourseNotFoundError();

  const completionRate =
    course.totalEnrollments > 0
      ? Math.round((course.completedEnrollments / course.totalEnrollments) * 100)
      : 0;

  return {
    course: {
      ...course,
      completionRate,
      totalRevenueUzs: course.totalRevenueUzs.toString(),
      totalRefundsUzs: course.totalRefundsUzs.toString(),
    },
    topicFunnel: funnel,
    topStudents: top.map((s) => ({
      ...s,
      lastAccessedAt: s.lastAccessedAt?.toISOString() ?? null,
    })),
    strugglingStudents: struggling.map((s) => ({
      ...s,
      lastAccessedAt: s.lastAccessedAt?.toISOString() ?? null,
    })),
    testStats: tests,
    assignmentStats: assignments,
  };
}
