/**
 * Course Topic repository — `course_topics` jadvali uchun.
 * Teacher tomonidan mavzularni boshqarish.
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export type CourseTopicRow = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  orderIndex: number;
  duration: string;
  content: string;
  hasQuiz: boolean;
  isFreePreview: boolean;
  isLocked: boolean;
  moduleTitle: string | null;
  createdAt: Date;
};

/** Course teacher'siga tegishliligini tekshirish (boshqa joylar uchun helper). */
export async function isCourseOwner(
  courseId: string,
  teacherId: string,
  tx?: Prisma.TransactionClient,
): Promise<boolean> {
  const client: PrismaLike = tx ?? prisma;
  const row = await client.course.findFirst({
    where: { id: courseId, teacherId },
    select: { id: true },
  });
  return row !== null;
}

export async function findByCourse(courseId: string): Promise<CourseTopicRow[]> {
  return prisma.courseTopic.findMany({
    where: { courseId },
    orderBy: { orderIndex: 'asc' },
  });
}

export async function findById(topicId: string): Promise<CourseTopicRow | null> {
  return prisma.courseTopic.findUnique({
    where: { id: topicId },
  });
}

export interface CreateTopicInput {
  courseId: string;
  title: string;
  description?: string | null;
  videoUrl?: string | null;
  duration?: string;
  content?: string;
  hasQuiz?: boolean;
  isFreePreview?: boolean;
  isLocked?: boolean;
  moduleTitle?: string | null;
}

export async function create(
  input: CreateTopicInput,
  tx?: Prisma.TransactionClient,
): Promise<CourseTopicRow> {
  const client: PrismaLike = tx ?? prisma;

  // Keyingi orderIndex ni hisoblash
  const maxOrder = await client.courseTopic.aggregate({
    where: { courseId: input.courseId },
    _max: { orderIndex: true },
  });
  const nextOrder = (maxOrder._max.orderIndex ?? 0) + 1;

  return client.courseTopic.create({
    data: {
      courseId: input.courseId,
      title: input.title,
      description: input.description ?? null,
      videoUrl: input.videoUrl ?? null,
      orderIndex: nextOrder,
      duration: input.duration ?? '0 min',
      content: input.content ?? '',
      hasQuiz: input.hasQuiz ?? false,
      isFreePreview: input.isFreePreview ?? false,
      isLocked: input.isLocked ?? false,
      moduleTitle: input.moduleTitle ?? null,
    },
  });
}

export interface UpdateTopicInput {
  title?: string;
  description?: string | null;
  videoUrl?: string | null;
  duration?: string;
  content?: string;
  hasQuiz?: boolean;
  isFreePreview?: boolean;
  isLocked?: boolean;
  moduleTitle?: string | null;
}

export async function update(
  topicId: string,
  data: UpdateTopicInput,
  tx?: Prisma.TransactionClient,
): Promise<CourseTopicRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.courseTopic.update({
    where: { id: topicId },
    data,
  });
}

export async function deleteById(
  topicId: string,
  tx?: Prisma.TransactionClient,
): Promise<{ courseId: string; orderIndex: number }> {
  const client: PrismaLike = tx ?? prisma;
  const deleted = await client.courseTopic.delete({
    where: { id: topicId },
    select: { courseId: true, orderIndex: true },
  });
  return deleted;
}

/**
 * orderIndex'larni qayta normalizatsiya qilish (1, 2, 3, ...).
 * Yangi tartibni qabul qiladi (UI'da ko'rsatilgani bo'yicha).
 */
export async function reorder(
  courseId: string,
  orderedTopicIds: string[],
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  // Bitta transaction'da updateMany'lar
  await Promise.all(
    orderedTopicIds.map((id, idx) =>
      client.courseTopic.update({
        where: { id },
        data: { orderIndex: idx + 1 },
      }),
    ),
  );
}

/**
 * Bitta topic'ni bir pozitsiya yuqori/past siljitish.
 * Atomic transaction (swap orderIndex with neighbor).
 */
export async function move(
  topicId: string,
  direction: 'up' | 'down',
  tx?: Prisma.TransactionClient,
): Promise<{ moved: boolean }> {
  const client: PrismaLike = tx ?? prisma;
  const current = await client.courseTopic.findUnique({ where: { id: topicId } });
  if (!current) return { moved: false };

  const neighbor = await client.courseTopic.findFirst({
    where: {
      courseId: current.courseId,
      orderIndex: direction === 'up'
        ? { lt: current.orderIndex }
        : { gt: current.orderIndex },
    },
    orderBy: { orderIndex: direction === 'up' ? 'desc' : 'asc' },
  });
  if (!neighbor) return { moved: false }; // chegarada

  // Swap
  await client.courseTopic.update({
    where: { id: topicId },
    data: { orderIndex: neighbor.orderIndex },
  });
  await client.courseTopic.update({
    where: { id: neighbor.id },
    data: { orderIndex: current.orderIndex },
  });
  return { moved: true };
}
