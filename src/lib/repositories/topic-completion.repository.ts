/**
 * Topic completion repository — topic_completions jadvali uchun.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export async function findByStudentAndTopic(
  studentId: string,
  topicId: string,
  tx?: Prisma.TransactionClient,
): Promise<{ id: string } | null> {
  const client: PrismaLike = tx ?? prisma;
  return client.topicCompletion.findUnique({
    where: { studentId_topicId: { studentId, topicId } },
    select: { id: true },
  });
}

export async function create(
  data: { studentId: string; topicId: string; courseId: string },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  await client.topicCompletion.create({ data });
}

export async function countByStudentAndCourse(
  studentId: string,
  courseId: string,
  tx?: Prisma.TransactionClient,
): Promise<number> {
  const client: PrismaLike = tx ?? prisma;
  return client.topicCompletion.count({ where: { studentId, courseId } });
}

export async function getCompletedTopicIds(
  studentId: string,
  courseId: string,
): Promise<Set<string>> {
  const rows = await prisma.topicCompletion.findMany({
    where: { studentId, courseId },
    select: { topicId: true },
  });
  return new Set(rows.map((r) => r.topicId));
}

export async function findByStudentAndCourses(
  studentId: string,
  courseIds: string[],
): Promise<Array<{ topicId: string; courseId: string }>> {
  if (courseIds.length === 0) return [];
  return prisma.topicCompletion.findMany({
    where: { studentId, courseId: { in: courseIds } },
    select: { topicId: true, courseId: true },
  });
}
