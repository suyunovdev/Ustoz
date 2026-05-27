/**
 * Enrollment repository — bitta jadval bilan ishlaydi.
 * Biznes logikasi YO'Q. Faqat Prisma query'lar.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export type EnrollmentBasic = Prisma.EnrollmentGetPayload<{}>;
export type EnrollmentWithCourse = Prisma.EnrollmentGetPayload<{
  include: {
    course: {
      include: {
        teacher: { select: { fullName: true; avatarUrl: true } };
        _count: { select: { topics: true } };
      };
    };
  };
}>;

export async function findByStudentAndCourse(
  studentId: string,
  courseId: string,
  tx?: Prisma.TransactionClient,
): Promise<EnrollmentBasic | null> {
  const client: PrismaLike = tx ?? prisma;
  return client.enrollment.findUnique({
    where: { studentId_courseId: { studentId, courseId } },
  });
}

export async function findActiveByStudent(
  studentId: string,
): Promise<EnrollmentWithCourse[]> {
  return prisma.enrollment.findMany({
    where: { studentId, isActive: true },
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
        include: {
          teacher: { select: { fullName: true, avatarUrl: true } },
          _count: { select: { topics: true } },
        },
      },
    },
  });
}

export async function findCourseIdsAndCategories(
  studentId: string,
): Promise<Array<{ courseId: string; categoryId: string | null }>> {
  const rows = await prisma.enrollment.findMany({
    where: { studentId, isActive: true },
    select: {
      courseId: true,
      course: { select: { categoryId: true } },
    },
  });
  return rows.map((r) => ({ courseId: r.courseId, categoryId: r.course.categoryId }));
}

export async function updateProgress(
  enrollmentId: string,
  data: {
    progress: number;
    completedAt?: Date | null;
    lastAccessedAt?: Date;
  },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  await client.enrollment.update({
    where: { id: enrollmentId },
    data,
  });
}

export async function touchEnrollment(
  studentId: string,
  courseId: string,
): Promise<{ count: number }> {
  const result = await prisma.enrollment.updateMany({
    where: { studentId, courseId, isActive: true },
    data: { lastAccessedAt: new Date() },
  });
  return { count: result.count };
}

export async function countByStudent(
  studentId: string,
): Promise<{ enrolled: number; completed: number }> {
  const [enrolled, completed] = await Promise.all([
    prisma.enrollment.count({ where: { studentId, isActive: true } }),
    prisma.enrollment.count({
      where: { studentId, isActive: true, progress: { gte: 100 } },
    }),
  ]);
  return { enrolled, completed };
}
