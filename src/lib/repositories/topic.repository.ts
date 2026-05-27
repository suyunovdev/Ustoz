/**
 * Topic repository — course_topics jadvali uchun.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export async function findById(
  id: string,
  tx?: Prisma.TransactionClient,
): Promise<{ courseId: string } | null> {
  const client: PrismaLike = tx ?? prisma;
  return client.courseTopic.findUnique({
    where: { id },
    select: { courseId: true },
  });
}

export async function findByCourse(
  courseId: string,
): Promise<Array<{ id: string; title: string; orderIndex: number }>> {
  return prisma.courseTopic.findMany({
    where: { courseId },
    orderBy: { orderIndex: 'asc' },
    select: { id: true, title: true, orderIndex: true },
  });
}

export async function findByCourses(
  courseIds: string[],
): Promise<Array<{ id: string; title: string; orderIndex: number; courseId: string }>> {
  if (courseIds.length === 0) return [];
  return prisma.courseTopic.findMany({
    where: { courseId: { in: courseIds } },
    orderBy: { orderIndex: 'asc' },
    select: { id: true, title: true, orderIndex: true, courseId: true },
  });
}

export async function countByCourse(
  courseId: string,
  tx?: Prisma.TransactionClient,
): Promise<number> {
  const client: PrismaLike = tx ?? prisma;
  return client.courseTopic.count({ where: { courseId } });
}
