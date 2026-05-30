/**
 * Analytics repository — raw SQL aggregations for teacher dashboards.
 *
 * Tezlik uchun barcha agregatsiyalar bitta query'da, Postgres FILTER va
 * generate_series ishlatiladi.
 */

import { prisma } from '@/lib/prisma';

export interface DailyRevenueRow {
  date: Date;
  revenue: bigint;
  enrollments: number;
  payments: number;
}

/**
 * So'nggi N kun uchun kunlik daromad + yozilishlar.
 * Bo'sh kunlar 0 bilan to'ldiriladi.
 */
export async function getDailyRevenue(
  teacherId: string,
  days: number,
): Promise<DailyRevenueRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{ date: Date; revenue: bigint; enrollments: bigint; payments: bigint }>
  >`
    WITH dates AS (
      SELECT generate_series(
        CURRENT_DATE - ((${days} - 1)::int * INTERVAL '1 day'),
        CURRENT_DATE,
        '1 day'::interval
      )::date AS date
    ),
    rev AS (
      SELECT pt.created_at::date AS date,
             COALESCE(SUM(pt.amount_uzs), 0)::bigint AS revenue,
             COUNT(*)::bigint AS payments
      FROM payment_transactions pt
      JOIN courses c ON c.id = pt.course_id
      WHERE c.teacher_id = ${teacherId}::uuid
        AND pt.status = 'completed'
        AND pt.created_at >= CURRENT_DATE - ((${days} - 1)::int * INTERVAL '1 day')
      GROUP BY 1
    ),
    enroll AS (
      SELECT e.enrolled_at::date AS date,
             COUNT(*)::bigint AS enrollments
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE c.teacher_id = ${teacherId}::uuid
        AND e.enrolled_at >= CURRENT_DATE - ((${days} - 1)::int * INTERVAL '1 day')
      GROUP BY 1
    )
    SELECT d.date,
           COALESCE(r.revenue, 0)::bigint AS revenue,
           COALESCE(e.enrollments, 0)::bigint AS enrollments,
           COALESCE(r.payments, 0)::bigint AS payments
    FROM dates d
    LEFT JOIN rev r ON r.date = d.date
    LEFT JOIN enroll e ON e.date = d.date
    ORDER BY d.date ASC
  `;
  return rows.map((r) => ({
    date: r.date,
    revenue: r.revenue,
    enrollments: Number(r.enrollments),
    payments: Number(r.payments),
  }));
}

export interface CompareRevenueRow {
  currentRevenue: bigint;
  previousRevenue: bigint;
  currentEnrollments: number;
  previousEnrollments: number;
}

/**
 * Joriy davr va o'tgan davr taqqoslash (M-o-M chart bilan birga ko'rsatish uchun).
 */
export async function compareRevenue(
  teacherId: string,
  days: number,
): Promise<CompareRevenueRow> {
  const rows = await prisma.$queryRaw<
    Array<{
      curRev: bigint;
      prevRev: bigint;
      curEnr: bigint;
      prevEnr: bigint;
    }>
  >`
    SELECT
      COALESCE(SUM(pt.amount_uzs) FILTER (
        WHERE pt.created_at >= CURRENT_DATE - ((${days} - 1)::int * INTERVAL '1 day')
      ), 0)::bigint AS "curRev",
      COALESCE(SUM(pt.amount_uzs) FILTER (
        WHERE pt.created_at >= CURRENT_DATE - ((${days * 2} - 1)::int * INTERVAL '1 day')
          AND pt.created_at < CURRENT_DATE - ((${days} - 1)::int * INTERVAL '1 day')
      ), 0)::bigint AS "prevRev",
      COUNT(DISTINCT e.id) FILTER (
        WHERE e.enrolled_at >= CURRENT_DATE - ((${days} - 1)::int * INTERVAL '1 day')
      )::bigint AS "curEnr",
      COUNT(DISTINCT e.id) FILTER (
        WHERE e.enrolled_at >= CURRENT_DATE - ((${days * 2} - 1)::int * INTERVAL '1 day')
          AND e.enrolled_at < CURRENT_DATE - ((${days} - 1)::int * INTERVAL '1 day')
      )::bigint AS "prevEnr"
    FROM courses c
    LEFT JOIN payment_transactions pt ON pt.course_id = c.id AND pt.status = 'completed'
    LEFT JOIN enrollments e ON e.course_id = c.id
    WHERE c.teacher_id = ${teacherId}::uuid
  `;
  const r = rows[0];
  return {
    currentRevenue: r.curRev,
    previousRevenue: r.prevRev,
    currentEnrollments: Number(r.curEnr),
    previousEnrollments: Number(r.prevEnr),
  };
}

export interface EngagementRow {
  totalMaterialViews: number;
  totalWatchSec: number;
  totalTopicCompletions: number;
  dailyActiveStudents: number;
  weeklyActiveStudents: number;
  monthlyActiveStudents: number;
}

/**
 * Kurslar bo'yicha umumiy engagement statistika.
 */
export async function getEngagement(teacherId: string): Promise<EngagementRow> {
  const rows = await prisma.$queryRaw<
    Array<{
      totalViews: bigint;
      totalWatchSec: bigint;
      totalTopicCompletions: bigint;
      dailyActive: bigint;
      weeklyActive: bigint;
      monthlyActive: bigint;
    }>
  >`
    SELECT
      COALESCE((
        SELECT COUNT(*)::bigint
        FROM material_views mv
        JOIN content_materials cm ON cm.id = mv.material_id
        JOIN courses c ON c.id = cm.course_id
        WHERE c.teacher_id = ${teacherId}::uuid
      ), 0)::bigint AS "totalViews",
      COALESCE((
        SELECT SUM(mv.watch_sec)::bigint
        FROM material_views mv
        JOIN content_materials cm ON cm.id = mv.material_id
        JOIN courses c ON c.id = cm.course_id
        WHERE c.teacher_id = ${teacherId}::uuid
          AND mv.watch_sec IS NOT NULL
      ), 0)::bigint AS "totalWatchSec",
      COALESCE((
        SELECT COUNT(*)::bigint FROM topic_completions tc
        JOIN courses c ON c.id = tc.course_id
        WHERE c.teacher_id = ${teacherId}::uuid
      ), 0)::bigint AS "totalTopicCompletions",
      COALESCE((
        SELECT COUNT(DISTINCT e.student_id)::bigint FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE c.teacher_id = ${teacherId}::uuid
          AND e.last_accessed_at >= NOW() - INTERVAL '1 day'
      ), 0)::bigint AS "dailyActive",
      COALESCE((
        SELECT COUNT(DISTINCT e.student_id)::bigint FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE c.teacher_id = ${teacherId}::uuid
          AND e.last_accessed_at >= NOW() - INTERVAL '7 days'
      ), 0)::bigint AS "weeklyActive",
      COALESCE((
        SELECT COUNT(DISTINCT e.student_id)::bigint FROM enrollments e
        JOIN courses c ON c.id = e.course_id
        WHERE c.teacher_id = ${teacherId}::uuid
          AND e.last_accessed_at >= NOW() - INTERVAL '30 days'
      ), 0)::bigint AS "monthlyActive"
  `;
  const r = rows[0];
  return {
    totalMaterialViews: Number(r.totalViews),
    totalWatchSec: Number(r.totalWatchSec),
    totalTopicCompletions: Number(r.totalTopicCompletions),
    dailyActiveStudents: Number(r.dailyActive),
    weeklyActiveStudents: Number(r.weeklyActive),
    monthlyActiveStudents: Number(r.monthlyActive),
  };
}

// ==================== PER-COURSE ANALYTICS ====================

export interface CourseAnalyticsRow {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  avgProgress: number;
  totalRevenueUzs: bigint;
  totalRefundsUzs: bigint;
  reviewCount: number;
  avgRating: number;
}

/**
 * Bitta kurs uchun KPI'lar.
 */
export async function getCourseAnalytics(
  courseId: string,
): Promise<CourseAnalyticsRow | null> {
  const rows = await prisma.$queryRaw<
    Array<{
      courseId: string;
      courseTitle: string;
      totalEnr: bigint;
      activeEnr: bigint;
      completedEnr: bigint;
      avgProgress: number;
      totalRev: bigint;
      totalRefunds: bigint;
      reviewCount: bigint;
      avgRating: number;
    }>
  >`
    SELECT
      c.id AS "courseId",
      c.title AS "courseTitle",
      (SELECT COUNT(*)::bigint FROM enrollments WHERE course_id = c.id) AS "totalEnr",
      (SELECT COUNT(*)::bigint FROM enrollments WHERE course_id = c.id AND is_active) AS "activeEnr",
      (SELECT COUNT(*)::bigint FROM enrollments WHERE course_id = c.id AND completed_at IS NOT NULL) AS "completedEnr",
      COALESCE((SELECT ROUND(AVG(progress))::float FROM enrollments WHERE course_id = c.id), 0) AS "avgProgress",
      COALESCE((SELECT SUM(amount_uzs)::bigint FROM payment_transactions WHERE course_id = c.id AND status = 'completed'), 0) AS "totalRev",
      COALESCE((SELECT SUM(amount_uzs)::bigint FROM payment_transactions WHERE course_id = c.id AND status = 'refunded'), 0) AS "totalRefunds",
      (SELECT COUNT(*)::bigint FROM course_reviews WHERE course_id = c.id) AS "reviewCount",
      COALESCE((SELECT AVG(rating)::float FROM course_reviews WHERE course_id = c.id), 0) AS "avgRating"
    FROM courses c
    WHERE c.id = ${courseId}::uuid
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    courseId: r.courseId,
    courseTitle: r.courseTitle,
    totalEnrollments: Number(r.totalEnr),
    activeEnrollments: Number(r.activeEnr),
    completedEnrollments: Number(r.completedEnr),
    avgProgress: Math.round(r.avgProgress ?? 0),
    totalRevenueUzs: r.totalRev,
    totalRefundsUzs: r.totalRefunds,
    reviewCount: Number(r.reviewCount),
    avgRating: Math.round((r.avgRating ?? 0) * 100) / 100,
  };
}

export interface TopicFunnelRow {
  topicId: string;
  topicTitle: string;
  orderIndex: number;
  completions: number;
  completionRate: number;
}

/**
 * Topic-bo'yicha funnel: har topic'ni qancha talaba tugatgan.
 * Drop-off point'larni topish uchun.
 */
export async function getTopicFunnel(courseId: string): Promise<TopicFunnelRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      topicId: string;
      topicTitle: string;
      orderIndex: number;
      completions: bigint;
      totalEnrolled: bigint;
    }>
  >`
    SELECT
      ct.id AS "topicId",
      ct.title AS "topicTitle",
      ct.order_index AS "orderIndex",
      COALESCE((SELECT COUNT(*)::bigint FROM topic_completions WHERE topic_id = ct.id), 0) AS "completions",
      COALESCE((SELECT COUNT(*)::bigint FROM enrollments WHERE course_id = ${courseId}::uuid), 0) AS "totalEnrolled"
    FROM course_topics ct
    WHERE ct.course_id = ${courseId}::uuid
    ORDER BY ct.order_index ASC
  `;
  return rows.map((r) => ({
    topicId: r.topicId,
    topicTitle: r.topicTitle,
    orderIndex: r.orderIndex,
    completions: Number(r.completions),
    completionRate:
      r.totalEnrolled > 0
        ? Math.round((Number(r.completions) / Number(r.totalEnrolled)) * 100)
        : 0,
  }));
}

export interface TopStudentRow {
  studentId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  progress: number;
  lastAccessedAt: Date | null;
}

/**
 * Kurs bo'yicha eng faol talabalar (progress + faollik bo'yicha).
 */
export async function getTopStudents(
  courseId: string,
  limit = 10,
): Promise<TopStudentRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      studentId: string;
      fullName: string;
      email: string;
      avatarUrl: string | null;
      progress: number;
      lastAccessedAt: Date | null;
    }>
  >`
    SELECT
      u.id AS "studentId",
      u.full_name AS "fullName",
      u.email,
      u.avatar_url AS "avatarUrl",
      e.progress,
      e.last_accessed_at AS "lastAccessedAt"
    FROM enrollments e
    JOIN user_profiles u ON u.id = e.student_id
    WHERE e.course_id = ${courseId}::uuid
    ORDER BY e.progress DESC, e.last_accessed_at DESC NULLS LAST
    LIMIT ${limit}
  `;
  return rows;
}

export interface StrugglingStudentRow {
  studentId: string;
  fullName: string;
  email: string;
  progress: number;
  lastAccessedAt: Date | null;
  daysSinceActivity: number | null;
}

/**
 * Qiyinlanayotgan talabalar — progress past, faollik kam.
 */
export async function getStrugglingStudents(
  courseId: string,
  limit = 10,
): Promise<StrugglingStudentRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      studentId: string;
      fullName: string;
      email: string;
      progress: number;
      lastAccessedAt: Date | null;
      daysSince: number | null;
    }>
  >`
    SELECT
      u.id AS "studentId",
      u.full_name AS "fullName",
      u.email,
      e.progress,
      e.last_accessed_at AS "lastAccessedAt",
      CASE
        WHEN e.last_accessed_at IS NULL THEN NULL
        ELSE EXTRACT(DAY FROM NOW() - e.last_accessed_at)::int
      END AS "daysSince"
    FROM enrollments e
    JOIN user_profiles u ON u.id = e.student_id
    WHERE e.course_id = ${courseId}::uuid
      AND e.is_active = TRUE
      AND e.completed_at IS NULL
      AND (
        e.progress < 30
        OR e.last_accessed_at IS NULL
        OR e.last_accessed_at < NOW() - INTERVAL '14 days'
      )
    ORDER BY e.progress ASC, e.last_accessed_at ASC NULLS FIRST
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    studentId: r.studentId,
    fullName: r.fullName,
    email: r.email,
    progress: r.progress,
    lastAccessedAt: r.lastAccessedAt,
    daysSinceActivity: r.daysSince,
  }));
}

export interface CourseTestStatsRow {
  testId: string;
  testTitle: string;
  status: string;
  totalAttempts: number;
  passedAttempts: number;
  passRate: number;
  avgScore: number;
}

/**
 * Kurs ichidagi testlar statistikasi.
 */
export async function getCourseTestStats(courseId: string): Promise<CourseTestStatsRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      testId: string;
      testTitle: string;
      status: string;
      totalAttempts: bigint;
      passedAttempts: bigint;
      avgScore: number;
    }>
  >`
    SELECT
      t.id AS "testId",
      t.title AS "testTitle",
      t.status,
      COALESCE((SELECT COUNT(*)::bigint FROM test_attempts WHERE test_id = t.id AND status = 'submitted'), 0) AS "totalAttempts",
      COALESCE((SELECT COUNT(*)::bigint FROM test_attempts WHERE test_id = t.id AND status = 'submitted' AND passed), 0) AS "passedAttempts",
      COALESCE((SELECT AVG(percentage)::float FROM test_attempts WHERE test_id = t.id AND status = 'submitted'), 0) AS "avgScore"
    FROM course_tests t
    WHERE t.course_id = ${courseId}::uuid
    ORDER BY t.created_at DESC
  `;
  return rows.map((r) => ({
    testId: r.testId,
    testTitle: r.testTitle,
    status: r.status,
    totalAttempts: Number(r.totalAttempts),
    passedAttempts: Number(r.passedAttempts),
    passRate:
      Number(r.totalAttempts) > 0
        ? Math.round((Number(r.passedAttempts) / Number(r.totalAttempts)) * 100)
        : 0,
    avgScore: Math.round((r.avgScore ?? 0) * 100) / 100,
  }));
}

export interface AssignmentStatsRow {
  assignmentId: string;
  title: string;
  status: string;
  submissionCount: number;
  gradedCount: number;
  lateCount: number;
  avgGrade: number;
  gradeRate: number;
}

/**
 * Vazifalar statistikasi.
 */
export async function getCourseAssignmentStats(
  courseId: string,
): Promise<AssignmentStatsRow[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      assignmentId: string;
      title: string;
      status: string;
      subCount: bigint;
      gradedCount: bigint;
      lateCount: bigint;
      avgGrade: number;
    }>
  >`
    SELECT
      a.id AS "assignmentId",
      a.title,
      a.status,
      COALESCE((SELECT COUNT(*)::bigint FROM assignment_submissions WHERE assignment_id = a.id), 0) AS "subCount",
      COALESCE((SELECT COUNT(*)::bigint FROM assignment_submissions WHERE assignment_id = a.id AND status = 'graded'), 0) AS "gradedCount",
      COALESCE((SELECT COUNT(*)::bigint FROM assignment_submissions WHERE assignment_id = a.id AND is_late), 0) AS "lateCount",
      COALESCE((SELECT AVG(grade)::float FROM assignment_submissions WHERE assignment_id = a.id AND grade IS NOT NULL), 0) AS "avgGrade"
    FROM assignments a
    WHERE a.course_id = ${courseId}::uuid
    ORDER BY a.due_date DESC
  `;
  return rows.map((r) => ({
    assignmentId: r.assignmentId,
    title: r.title,
    status: r.status,
    submissionCount: Number(r.subCount),
    gradedCount: Number(r.gradedCount),
    lateCount: Number(r.lateCount),
    avgGrade: Math.round((r.avgGrade ?? 0) * 100) / 100,
    gradeRate:
      Number(r.subCount) > 0
        ? Math.round((Number(r.gradedCount) / Number(r.subCount)) * 100)
        : 0,
  }));
}
