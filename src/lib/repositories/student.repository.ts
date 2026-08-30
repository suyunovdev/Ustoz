/**
 * Student management repository — teacher view.
 *
 * Teacher o'z kurslariga yozilgan talabalarni boshqaradi:
 *   - Aggregated list (har talaba uchun jami kurslar, progress, oxirgi faollik)
 *   - Per-student detail (har kurs uchun progress, test attempts, assignments)
 *   - Enrollment toggle (block/unblock)
 *   - Enrollment removal
 */

import { prisma } from '@/lib/prisma';

export interface TeacherStudentRow {
  studentId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  enrolledCourses: number;
  activeEnrollments: number;
  completedCourses: number;
  avgProgress: number;
  lastActivityAt: Date | null;
  firstEnrolledAt: Date;
  totalPayments: bigint;
}

/**
 * Teacher'ning barcha kurslariga yozilgan talabalar aggregate qilingan.
 * Search — fullName yoki email ichida.
 */
export interface TeacherStudentsPage {
  rows: TeacherStudentRow[];
  /** Filtrga mos jami noyob talabalar soni (pagination uchun). */
  total: number;
}

/** Aniq paginatsiyada bitta sahifadagi maksimal talaba (og'ir sahifaга qarshi). */
const MAX_STUDENTS_PER_PAGE = 100;
/**
 * `limit` berilmaganda (eski chaqiruvchilar — masalan guruh/sertifikat picker'lari
 * to'liq ro'yxatni client-side filtrlaydi) qo'llaniladigan cap. Backward-compatible.
 */
const LEGACY_UNPAGED_CAP = 500;

export async function listTeacherStudents(
  teacherId: string,
  filters: { courseId?: string; search?: string; activeOnly?: boolean } = {},
  page: { limit?: number; offset?: number } = {},
): Promise<TeacherStudentsPage> {
  const limit =
    page.limit === undefined
      ? LEGACY_UNPAGED_CAP
      : Math.min(Math.max(Math.floor(page.limit), 1), MAX_STUDENTS_PER_PAGE);
  const offset = Math.max(Math.floor(page.offset ?? 0), 0);

  // Filtr shartlari + parametrlar tartibli yig'iladi. `bind` har chaqiruvda
  // qiymatni params'ga qo'shib, uning 1-indeksli $N placeholder'ini qaytaradi —
  // qo'lda "$${courseId?3:2}" raqamlash o'rniga (xatoga chidamli).
  const params: (string | number)[] = [teacherId];
  const bind = (value: string | number) => `$${params.push(value)}`;

  const conds: string[] = ['c.teacher_id = $1::uuid'];
  if (filters.courseId) conds.push(`e.course_id = ${bind(filters.courseId)}::uuid`);

  const search = filters.search?.trim().toLowerCase();
  if (search) {
    // LIKE maxsus belgilarini (\ % _) escape qilamiz — foydalanuvchi kiritган
    // "50%" yoki "a_b" wildcard sifatida ishlamasin (SQL injection emas —
    // qiymat baribir parametrlangan; bu faqat qidiruv semantikasi).
    const ph = bind(search.replace(/[\\%_]/g, '\\$&'));
    conds.push(
      `(LOWER(u.full_name) LIKE '%' || ${ph} || '%' ESCAPE '\\' ` +
        `OR LOWER(u.email) LIKE '%' || ${ph} || '%' ESCAPE '\\')`,
    );
  }
  if (filters.activeOnly) conds.push('e.is_active = TRUE');

  const fromWhere = `
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    JOIN user_profiles u ON u.id = e.student_id
    WHERE ${conds.join('\n      AND ')}
  `;

  // total — filtr param'lari bilan (limit/offset'gача). Alohida saqlab, list
  // so'rovi keyin limit/offset param'larini qo'shadi.
  const filterParams = [...params];
  const countSql = `SELECT COUNT(*)::int AS total FROM (SELECT u.id ${fromWhere} GROUP BY u.id) sub`;

  const listSql = `
    SELECT
      u.id AS "studentId",
      u.full_name AS "fullName",
      u.email,
      u.avatar_url AS "avatarUrl",
      COUNT(DISTINCT e.course_id)::int AS "enrolledCourses",
      COUNT(DISTINCT CASE WHEN e.is_active THEN e.course_id END)::int AS "activeEnrollments",
      COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.course_id END)::int AS "completedCourses",
      COALESCE(ROUND(AVG(e.progress)), 0)::int AS "avgProgress",
      MAX(e.last_accessed_at) AS "lastActivityAt",
      MIN(e.enrolled_at) AS "firstEnrolledAt",
      COALESCE(
        (SELECT SUM(p.amount_uzs) FROM payment_transactions p
          JOIN courses c2 ON c2.id = p.course_id
          WHERE p.student_id = u.id
            AND c2.teacher_id = $1::uuid
            AND p.status::text = 'completed'),
        0
      )::bigint AS "totalPayments"
    ${fromWhere}
    GROUP BY u.id, u.full_name, u.email, u.avatar_url
    -- u.id — ikkilamchi kalit: bir xil last_accessed_at'da paginatsiya deterministik
    ORDER BY MAX(e.last_accessed_at) DESC NULLS LAST, u.id ASC
    LIMIT ${bind(limit)} OFFSET ${bind(offset)}
  `;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRawUnsafe<TeacherStudentRow[]>(listSql, ...params),
    prisma.$queryRawUnsafe<Array<{ total: number }>>(countSql, ...filterParams),
  ]);

  return { rows, total: countRows[0]?.total ?? rows.length };
}

export interface StudentEnrollmentDetail {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: Date;
  progress: number;
  completedAt: Date | null;
  isActive: boolean;
  lastAccessedAt: Date | null;
}

export interface StudentDetailRow {
  studentId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  enrollments: StudentEnrollmentDetail[];
  totalTopicCompletions: number;
  totalTestAttempts: number;
  passedTestAttempts: number;
  avgTestScore: number | null;
  totalAssignmentSubmissions: number;
  gradedAssignmentSubmissions: number;
  avgAssignmentGrade: number | null;
  totalCertificates: number;
  totalPaymentsUzs: bigint;
}

/**
 * Talaba bo'yicha to'liq ma'lumot — teacher faqat o'z kurslariga yozilgan
 * talabani ko'ra oladi (aks holda 404 sifatida service tashlaydi).
 */
export async function getStudentDetailForTeacher(
  studentId: string,
  teacherId: string,
): Promise<StudentDetailRow | null> {
  // Talaba teacher'ning kursiga yozilganmi
  const access = await prisma.enrollment.findFirst({
    where: { studentId, course: { teacherId } },
    select: { id: true },
  });
  if (!access) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      createdAt: true,
    },
  });
  if (!profile) return null;

  const [enrollments, testStats, assignmentStats, certCount, payments, topicCompletions] =
    await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId, course: { teacherId } },
        include: { course: { select: { id: true, title: true } } },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.testAttempt.findMany({
        where: {
          studentId,
          status: 'submitted',
          test: { course: { teacherId } },
        },
        select: { passed: true, percentage: true },
      }),
      prisma.assignmentSubmission.findMany({
        where: {
          studentId,
          assignment: { course: { teacherId } },
        },
        select: { status: true, grade: true },
      }),
      prisma.certificate.count({
        where: { studentId, course: { teacherId } },
      }),
      prisma.paymentTransaction.aggregate({
        where: {
          studentId,
          status: 'completed',
          course: { teacherId },
        },
        _sum: { amountUzs: true },
      }),
      prisma.topicCompletion.count({
        where: { studentId, course: { teacherId } },
      }),
    ]);

  const passedAttempts = testStats.filter((a) => a.passed).length;
  const avgTest =
    testStats.length > 0
      ? testStats.reduce((s, a) => s + Number(a.percentage ?? 0), 0) / testStats.length
      : null;
  const gradedSubmissions = assignmentStats.filter(
    (a) => a.status === 'graded' && a.grade !== null,
  );
  const avgAssignment =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((s, a) => s + (a.grade ?? 0), 0) /
        gradedSubmissions.length
      : null;

  return {
    studentId: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    avatarUrl: profile.avatarUrl,
    createdAt: profile.createdAt,
    enrollments: enrollments.map((e) => ({
      enrollmentId: e.id,
      courseId: e.course.id,
      courseTitle: e.course.title,
      enrolledAt: e.enrolledAt,
      progress: e.progress,
      completedAt: e.completedAt,
      isActive: e.isActive,
      lastAccessedAt: e.lastAccessedAt,
    })),
    totalTopicCompletions: topicCompletions,
    totalTestAttempts: testStats.length,
    passedTestAttempts: passedAttempts,
    avgTestScore: avgTest !== null ? Math.round(avgTest * 100) / 100 : null,
    totalAssignmentSubmissions: assignmentStats.length,
    gradedAssignmentSubmissions: gradedSubmissions.length,
    avgAssignmentGrade: avgAssignment !== null ? Math.round(avgAssignment * 100) / 100 : null,
    totalCertificates: certCount,
    totalPaymentsUzs: payments._sum?.amountUzs ?? BigInt(0),
  };
}

// ==================== ENROLLMENT MANAGEMENT ====================

export async function isEnrollmentOwner(
  enrollmentId: string,
  teacherId: string,
): Promise<{ ok: boolean; courseId: string | null; studentId: string | null }> {
  const e = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: { select: { teacherId: true, id: true } } },
  });
  if (!e) return { ok: false, courseId: null, studentId: null };
  return {
    ok: e.course.teacherId === teacherId,
    courseId: e.course.id,
    studentId: e.studentId,
  };
}

export async function setEnrollmentActive(
  enrollmentId: string,
  isActive: boolean,
) {
  return prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { isActive },
  });
}

export async function deleteEnrollment(enrollmentId: string): Promise<void> {
  await prisma.enrollment.delete({ where: { id: enrollmentId } });
}

// ==================== NOTIFY ====================

export interface NotifyInput {
  recipientId: string;
  senderId: string;
  title: string;
  message: string;
  relatedCourseId?: string | null;
}

export async function sendNotification(input: NotifyInput) {
  return prisma.notification.create({
    data: {
      recipientId: input.recipientId,
      senderId: input.senderId,
      type: 'course_update',
      title: input.title,
      message: input.message,
      relatedCourseId: input.relatedCourseId ?? null,
    },
  });
}
