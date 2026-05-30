/**
 * Certificate repository — kurs tugatish sertifikatlari.
 *
 * Imkoniyatlar:
 *   - Auto-issue: enrollment.completed_at + 100% progress => sertifikat
 *   - Manual issue: teacher/admin tomonidan
 *   - Public verification by certificate number
 *   - Revoke (status='revoked' bilan, hard delete emas)
 *   - Snapshot ma'lumotlar (student/course/teacher nomi sertifikatda saqlanadi)
 */

import { prisma } from '@/lib/prisma';
import { randomBytes } from 'node:crypto';

export type CertificateStatus = 'active' | 'revoked';
export type IssueSource = 'auto' | 'manual' | 'admin';

export interface CertificateRow {
  id: string;
  certificateNumber: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  teacherName: string;
  finalGrade: number | null;
  completionPercent: number;
  status: string;
  issueSource: string;
  issuedAt: Date;
  issuedById: string | null;
  revokedAt: Date | null;
  revokeReason: string | null;
  revokedById: string | null;
  verificationUrl: string | null;
  studentNameSnapshot: string | null;
  courseTitleSnapshot: string | null;
  teacherNameSnapshot: string | null;
}

// Backward compat (student-dashboard ishlatadi)
export type StudentCertificateRow = {
  id: string;
  courseId: string;
  certificateNumber: string;
  issuedAt: Date;
  verificationUrl: string | null;
  course: { title: string };
};

function generateCertificateNumber(): string {
  // CERT-YYYY-XXXXXX (max 20 char)
  const year = new Date().getFullYear();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `CERT-${year}-${rand}`;
}

// ==================== LEGACY (backward compat) ====================

export async function findByStudent(
  studentId: string,
  take?: number,
): Promise<StudentCertificateRow[]> {
  return prisma.certificate.findMany({
    where: { studentId, status: 'active' },
    orderBy: { issuedAt: 'desc' },
    include: { course: { select: { title: true } } },
    ...(take ? { take } : {}),
  });
}

export async function countByStudent(studentId: string): Promise<number> {
  return prisma.certificate.count({ where: { studentId, status: 'active' } });
}

// ==================== ISSUE ====================

export interface IssueCertificateInput {
  studentId: string;
  courseId: string;
  finalGrade?: number | null;
  completionPercent?: number;
  issueSource: IssueSource;
  issuedById?: string | null;
  baseUrl: string;
}

/**
 * Sertifikat berish (yoki mavjudini qaytarish).
 * Idempotent — bir kursga bir talabaga faqat bitta sertifikat (DB unique).
 */
export async function issueCertificate(
  input: IssueCertificateInput,
): Promise<{ id: string; certificateNumber: string; created: boolean }> {
  const existing = await prisma.certificate.findUnique({
    where: { studentId_courseId: { studentId: input.studentId, courseId: input.courseId } },
    select: { id: true, certificateNumber: true, status: true },
  });

  if (existing) {
    if (existing.status === 'revoked') {
      await prisma.certificate.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          revokedAt: null,
          revokeReason: null,
          revokedById: null,
        },
      });
    }
    return {
      id: existing.id,
      certificateNumber: existing.certificateNumber,
      created: false,
    };
  }

  const student = await prisma.userProfile.findUnique({
    where: { id: input.studentId },
    select: { fullName: true },
  });
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
    select: {
      title: true,
      teacher: { select: { fullName: true } },
    },
  });

  if (!student || !course) {
    throw new Error('STUDENT_OR_COURSE_NOT_FOUND');
  }

  let certificateNumber = '';
  for (let attempt = 0; attempt < 5; attempt++) {
    certificateNumber = generateCertificateNumber();
    const collision = await prisma.certificate.findUnique({
      where: { certificateNumber },
      select: { id: true },
    });
    if (!collision) break;
  }

  const verificationUrl = `${input.baseUrl}/verify/${certificateNumber}`;

  const created = await prisma.certificate.create({
    data: {
      studentId: input.studentId,
      courseId: input.courseId,
      certificateNumber,
      verificationUrl,
      studentNameSnapshot: student.fullName,
      courseTitleSnapshot: course.title,
      teacherNameSnapshot: course.teacher.fullName,
      finalGrade: input.finalGrade ?? null,
      completionPercent: input.completionPercent ?? 100,
      issueSource: input.issueSource,
      issuedById: input.issuedById ?? null,
      status: 'active',
    },
  });

  return {
    id: created.id,
    certificateNumber,
    created: true,
  };
}

// ==================== READ ====================

export async function findByNumber(
  certificateNumber: string,
): Promise<CertificateRow | null> {
  const c = await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: {
      student: { select: { fullName: true, email: true } },
      course: { select: { title: true, teacher: { select: { fullName: true } } } },
    },
  });
  if (!c) return null;
  return mapRow(c);
}

export async function findById(id: string): Promise<CertificateRow | null> {
  const c = await prisma.certificate.findUnique({
    where: { id },
    include: {
      student: { select: { fullName: true, email: true } },
      course: { select: { title: true, teacher: { select: { fullName: true } } } },
    },
  });
  if (!c) return null;
  return mapRow(c);
}

export async function listStudentCertificatesDetailed(
  studentId: string,
): Promise<CertificateRow[]> {
  const rows = await prisma.certificate.findMany({
    where: { studentId },
    include: {
      student: { select: { fullName: true, email: true } },
      course: { select: { title: true, teacher: { select: { fullName: true } } } },
    },
    orderBy: { issuedAt: 'desc' },
  });
  return rows.map(mapRow);
}

export interface ListTeacherCertsFilters {
  courseId?: string;
  status?: CertificateStatus;
  search?: string;
  cursor?: string;
  limit?: number;
}

export async function listTeacherCertificates(
  teacherId: string,
  filters: ListTeacherCertsFilters,
): Promise<{ rows: CertificateRow[]; nextCursor: string | null }> {
  const limit = filters.limit ?? 30;
  const where: any = { course: { teacherId } };
  if (filters.courseId) where.courseId = filters.courseId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { certificateNumber: { contains: filters.search, mode: 'insensitive' } },
      { student: { fullName: { contains: filters.search, mode: 'insensitive' } } },
      { student: { email: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }
  if (filters.cursor) where.id = { lt: filters.cursor };

  const rows = await prisma.certificate.findMany({
    where,
    include: {
      student: { select: { fullName: true, email: true } },
      course: { select: { title: true, teacher: { select: { fullName: true } } } },
    },
    orderBy: { issuedAt: 'desc' },
    take: limit + 1,
  });
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    rows: items.map(mapRow),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

function mapRow(c: any): CertificateRow {
  return {
    id: c.id,
    certificateNumber: c.certificateNumber,
    studentId: c.studentId,
    studentName: c.studentNameSnapshot ?? c.student.fullName,
    studentEmail: c.student.email,
    courseId: c.courseId,
    courseTitle: c.courseTitleSnapshot ?? c.course.title,
    teacherName: c.teacherNameSnapshot ?? c.course.teacher.fullName,
    finalGrade: c.finalGrade,
    completionPercent: c.completionPercent,
    status: c.status,
    issueSource: c.issueSource,
    issuedAt: c.issuedAt,
    issuedById: c.issuedById,
    revokedAt: c.revokedAt,
    revokeReason: c.revokeReason,
    revokedById: c.revokedById,
    verificationUrl: c.verificationUrl,
    studentNameSnapshot: c.studentNameSnapshot,
    courseTitleSnapshot: c.courseTitleSnapshot,
    teacherNameSnapshot: c.teacherNameSnapshot,
  };
}

// ==================== REVOKE ====================

export interface RevokeInput {
  certificateId: string;
  reason: string;
  revokedById: string;
}

export async function revokeCertificate(input: RevokeInput): Promise<void> {
  await prisma.certificate.update({
    where: { id: input.certificateId },
    data: {
      status: 'revoked',
      revokedAt: new Date(),
      revokeReason: input.reason,
      revokedById: input.revokedById,
    },
  });
}

// ==================== ACCESS ====================

export async function isCertificateCourseOwner(
  certificateId: string,
  teacherId: string,
): Promise<boolean> {
  const c = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: { course: { select: { teacherId: true } } },
  });
  return c?.course.teacherId === teacherId;
}

/**
 * Talaba kursni tugatganmi (auto-issue qoidasi).
 */
export async function isEligibleForCertificate(
  studentId: string,
  courseId: string,
): Promise<{ eligible: boolean; progress: number; completed: boolean }> {
  const e = await prisma.enrollment.findFirst({
    where: { studentId, courseId },
    select: { progress: true, completedAt: true },
  });
  if (!e) return { eligible: false, progress: 0, completed: false };
  return {
    eligible: e.progress >= 100 || e.completedAt !== null,
    progress: e.progress,
    completed: e.completedAt !== null,
  };
}
