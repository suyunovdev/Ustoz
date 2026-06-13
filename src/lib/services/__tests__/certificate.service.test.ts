import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/repositories', () => ({
  certificateRepo: {
    isEligibleForCertificate: vi.fn(),
    issueCertificate: vi.fn(),
    isCertificateCourseOwner: vi.fn(),
    revokeCertificate: vi.fn(),
    findByNumber: vi.fn(),
    listStudentCertificatesDetailed: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    course: { findUnique: vi.fn() },
  },
}));

import {
  maybeAutoIssue,
  manualIssueByTeacher,
  revokeByTeacher,
  verifyPublic,
  CertificateNotFoundError,
  CertificateAccessDeniedError,
  NotEligibleError,
} from '../certificate.service';
import { certificateRepo } from '@/lib/repositories';
import { prisma } from '@/lib/prisma';
import { ValidationError } from '@/lib/errors';

const STUDENT = 'student-1';
const COURSE = 'course-1';
const TEACHER = 'teacher-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('maybeAutoIssue', () => {
  it('eligible bo\'lmasa null qaytaradi', async () => {
    vi.mocked(certificateRepo.isEligibleForCertificate).mockResolvedValue({
      eligible: false,
      progress: 60,
      completed: false,
    });

    const result = await maybeAutoIssue(STUDENT, COURSE);
    expect(result).toBeNull();
    expect(certificateRepo.issueCertificate).not.toHaveBeenCalled();
  });

  it('eligible bo\'lsa sertifikat yaratadi', async () => {
    vi.mocked(certificateRepo.isEligibleForCertificate).mockResolvedValue({
      eligible: true,
      progress: 100,
      completed: true,
    });
    vi.mocked(certificateRepo.issueCertificate).mockResolvedValue({
      id: 'cert-1',
      certificateNumber: 'UST-001',
      created: true,
    });

    const result = await maybeAutoIssue(STUDENT, COURSE);
    expect(result).toMatchObject({ id: 'cert-1', created: true });
    expect(certificateRepo.issueCertificate).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: STUDENT,
        courseId: COURSE,
        issueSource: 'auto',
      }),
    );
  });
});

describe('manualIssueByTeacher', () => {
  it('kurs topilmasa xato tashlaydi', async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValue(null);

    await expect(
      manualIssueByTeacher(TEACHER, { studentId: STUDENT, courseId: COURSE }),
    ).rejects.toThrow(ValidationError);
  });

  it('boshqa o\'qituvchining kursiga sertifikat bermoqchi bo\'lsa xato', async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValue({ teacherId: 'other-teacher' } as any);

    await expect(
      manualIssueByTeacher(TEACHER, { studentId: STUDENT, courseId: COURSE }),
    ).rejects.toThrow(CertificateAccessDeniedError);
  });

  it('talaba eligible emas va forceIssue yo\'q — NotEligibleError', async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValue({ teacherId: TEACHER } as any);
    vi.mocked(certificateRepo.isEligibleForCertificate).mockResolvedValue({
      eligible: false,
      progress: 40,
      completed: false,
    });

    await expect(
      manualIssueByTeacher(TEACHER, { studentId: STUDENT, courseId: COURSE }),
    ).rejects.toThrow(NotEligibleError);
  });

  it('forceIssue=true bo\'lsa eligible bo\'lmasa ham beradi', async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValue({ teacherId: TEACHER } as any);
    vi.mocked(certificateRepo.isEligibleForCertificate).mockResolvedValue({
      eligible: false,
      progress: 40,
      completed: false,
    });
    vi.mocked(certificateRepo.issueCertificate).mockResolvedValue({
      id: 'cert-2',
      certificateNumber: 'UST-002',
      created: true,
    });

    const result = await manualIssueByTeacher(TEACHER, {
      studentId: STUDENT,
      courseId: COURSE,
      forceIssue: true,
    });
    expect(result).toMatchObject({ id: 'cert-2' });
  });

  it('noto\'g\'ri bal (< 0 yoki > 100) — ValidationError', async () => {
    vi.mocked(prisma.course.findUnique).mockResolvedValue({ teacherId: TEACHER } as any);

    await expect(
      manualIssueByTeacher(TEACHER, {
        studentId: STUDENT,
        courseId: COURSE,
        finalGrade: 150,
      }),
    ).rejects.toThrow(ValidationError);
  });
});

describe('revokeByTeacher', () => {
  it('o\'zining kursi bo\'lmasa xato', async () => {
    vi.mocked(certificateRepo.isCertificateCourseOwner).mockResolvedValue(false);

    await expect(revokeByTeacher('cert-1', TEACHER, 'Noto\'g\'ri berilgan')).rejects.toThrow(
      CertificateAccessDeniedError,
    );
  });

  it('sabab qisqa bo\'lsa xato', async () => {
    vi.mocked(certificateRepo.isCertificateCourseOwner).mockResolvedValue(true);

    await expect(revokeByTeacher('cert-1', TEACHER, 'ab')).rejects.toThrow(ValidationError);
  });

  it('muvaffaqiyatli revoke', async () => {
    vi.mocked(certificateRepo.isCertificateCourseOwner).mockResolvedValue(true);
    vi.mocked(certificateRepo.revokeCertificate).mockResolvedValue(undefined);

    await revokeByTeacher('cert-1', TEACHER, 'Plagiat aniqlandi');
    expect(certificateRepo.revokeCertificate).toHaveBeenCalledWith({
      certificateId: 'cert-1',
      reason: 'Plagiat aniqlandi',
      revokedById: TEACHER,
    });
  });
});

describe('verifyPublic', () => {
  it('topilmasa CertificateNotFoundError', async () => {
    vi.mocked(certificateRepo.findByNumber).mockResolvedValue(null);

    await expect(verifyPublic('UST-999')).rejects.toThrow(CertificateNotFoundError);
  });

  it('topilsa sertifikatni qaytaradi', async () => {
    const cert = { id: 'cert-1', certificateNumber: 'UST-001' };
    vi.mocked(certificateRepo.findByNumber).mockResolvedValue(cert as any);

    const result = await verifyPublic('UST-001');
    expect(result).toMatchObject({ certificateNumber: 'UST-001' });
  });
});
