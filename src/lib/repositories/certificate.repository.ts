/**
 * Certificate repository.
 */

import { prisma } from '@/lib/prisma';

export type StudentCertificateRow = {
  id: string;
  courseId: string;
  certificateNumber: string;
  issuedAt: Date;
  verificationUrl: string | null;
  course: { title: string };
};

export async function findByStudent(
  studentId: string,
  take?: number,
): Promise<StudentCertificateRow[]> {
  return prisma.certificate.findMany({
    where: { studentId },
    orderBy: { issuedAt: 'desc' },
    include: { course: { select: { title: true } } },
    ...(take ? { take } : {}),
  });
}

export async function countByStudent(studentId: string): Promise<number> {
  return prisma.certificate.count({ where: { studentId } });
}
