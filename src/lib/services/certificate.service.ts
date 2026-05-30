/**
 * Certificate Service.
 *
 * Auto-issue: hozircha topic completion endpoint'idan chaqirib turamiz.
 * Teacher override: enrollment to'liq bo'lmasa ham qo'l bilan beraladi.
 * Public verify: anonim foydalanuvchi kira oladi.
 */

import { certificateRepo } from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';

export class CertificateNotFoundError extends Error {
  code = 'CERTIFICATE_NOT_FOUND';
  constructor() {
    super("Sertifikat topilmadi");
    this.name = 'CertificateNotFoundError';
  }
}

export class CertificateAccessDeniedError extends Error {
  code = 'CERTIFICATE_ACCESS_DENIED';
  constructor() {
    super("Ruxsat yo'q");
    this.name = 'CertificateAccessDeniedError';
  }
}

export class NotEligibleError extends Error {
  code = 'NOT_ELIGIBLE';
  constructor(progress: number) {
    super(`Talaba kursni tugatmagan (progress: ${progress}%)`);
    this.name = 'NotEligibleError';
  }
}

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:4028'
  );
}

// ==================== AUTO-ISSUE ====================

/**
 * Auto-issue qoidasi: enrollment 100% yoki completed_at bo'lsa.
 * Topic completion / lesson completion endpoint'idan chaqirilishi mumkin.
 */
export async function maybeAutoIssue(
  studentId: string,
  courseId: string,
): Promise<{ id: string; certificateNumber: string; created: boolean } | null> {
  const eligibility = await certificateRepo.isEligibleForCertificate(studentId, courseId);
  if (!eligibility.eligible) return null;
  return certificateRepo.issueCertificate({
    studentId,
    courseId,
    completionPercent: eligibility.progress,
    issueSource: 'auto',
    baseUrl: getBaseUrl(),
  });
}

// ==================== MANUAL ISSUE (teacher) ====================

export interface ManualIssueInput {
  studentId: string;
  courseId: string;
  finalGrade?: number;
  forceIssue?: boolean;
}

export async function manualIssueByTeacher(
  teacherId: string,
  input: ManualIssueInput,
) {
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
    select: { teacherId: true },
  });
  if (!course) throw new ValidationError("Kurs topilmadi");
  if (course.teacherId !== teacherId) throw new CertificateAccessDeniedError();

  if (input.finalGrade !== undefined) {
    if (input.finalGrade < 0 || input.finalGrade > 100) {
      throw new ValidationError("Bal 0-100 oralig'ida");
    }
  }

  const eligibility = await certificateRepo.isEligibleForCertificate(
    input.studentId,
    input.courseId,
  );
  if (!eligibility.eligible && !input.forceIssue) {
    throw new NotEligibleError(eligibility.progress);
  }

  return certificateRepo.issueCertificate({
    studentId: input.studentId,
    courseId: input.courseId,
    finalGrade: input.finalGrade,
    completionPercent: eligibility.progress,
    issueSource: 'manual',
    issuedById: teacherId,
    baseUrl: getBaseUrl(),
  });
}

// ==================== REVOKE ====================

export async function revokeByTeacher(
  certificateId: string,
  teacherId: string,
  reason: string,
) {
  const isOwner = await certificateRepo.isCertificateCourseOwner(certificateId, teacherId);
  if (!isOwner) throw new CertificateAccessDeniedError();
  if (!reason || reason.trim().length < 5) {
    throw new ValidationError("Sabab kamida 5 belgi");
  }
  await certificateRepo.revokeCertificate({
    certificateId,
    reason: reason.trim(),
    revokedById: teacherId,
  });
}

// ==================== READ ====================

export async function verifyPublic(certificateNumber: string) {
  const cert = await certificateRepo.findByNumber(certificateNumber);
  if (!cert) throw new CertificateNotFoundError();
  return cert;
}

export async function listMy(studentId: string) {
  return certificateRepo.listStudentCertificatesDetailed(studentId);
}

export async function listForTeacher(
  teacherId: string,
  filters: {
    courseId?: string;
    status?: 'active' | 'revoked';
    search?: string;
    cursor?: string;
  } = {},
) {
  return certificateRepo.listTeacherCertificates(teacherId, filters);
}
