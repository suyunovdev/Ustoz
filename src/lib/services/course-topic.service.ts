/**
 * Course Topic Service
 * --------------------
 * Teacher tomonidan kurs mavzularini boshqarish.
 *
 * Qoidalar:
 *   - Faqat o'z kursini boshqarish (teacher_id check har action'da)
 *   - Title minimum 2 belgi
 *   - YouTube/Vimeo videoUrl uchun validation yo'q (kelajakda)
 */

import { prisma } from '@/lib/prisma';
import {
  courseTopicRepo,
  type CourseTopicRow,
  type CreateTopicInput,
  type UpdateTopicInput,
} from '@/lib/repositories';
import { CourseNotFoundError, ValidationError } from '@/lib/errors';

export class TopicNotFoundError extends Error {
  code = 'TOPIC_NOT_FOUND';
  constructor(id: string) {
    super(`Topic not found: ${id}`);
    this.name = 'TopicNotFoundError';
  }
}

export async function listTopics(
  courseId: string,
  teacherId: string,
): Promise<CourseTopicRow[]> {
  const isOwner = await courseTopicRepo.isCourseOwner(courseId, teacherId);
  if (!isOwner) throw new CourseNotFoundError(courseId);
  return courseTopicRepo.findByCourse(courseId);
}

function validateInput<T extends { title?: string; duration?: string }>(input: T): T {
  if (input.title !== undefined) {
    const t = input.title.trim();
    if (t.length < 2) throw new ValidationError("Mavzu nomi kamida 2 belgi");
    if (t.length > 200) throw new ValidationError("Mavzu nomi 200 belgidan oshmasin");
    input.title = t;
  }
  if (input.duration !== undefined && input.duration.length > 40) {
    throw new ValidationError("Davomiylik formati noto'g'ri");
  }
  return input;
}

export async function createTopic(
  teacherId: string,
  input: Omit<CreateTopicInput, 'courseId'> & { courseId: string },
): Promise<CourseTopicRow> {
  const isOwner = await courseTopicRepo.isCourseOwner(input.courseId, teacherId);
  if (!isOwner) throw new CourseNotFoundError(input.courseId);

  const validated = validateInput({ ...input });
  if (!validated.title) throw new ValidationError("Mavzu nomi kerak");

  // Course total_duration ni ham yangilash mumkin (kelajakda)
  return courseTopicRepo.create({
    courseId: validated.courseId,
    title: validated.title,
    description: validated.description ?? null,
    videoUrl: validated.videoUrl ?? null,
    duration: validated.duration ?? '0 min',
    content: validated.content ?? '',
    hasQuiz: validated.hasQuiz ?? false,
    isFreePreview: validated.isFreePreview ?? false,
    isLocked: validated.isLocked ?? false,
    moduleTitle: validated.moduleTitle ?? null,
  });
}

export async function updateTopic(
  teacherId: string,
  topicId: string,
  input: UpdateTopicInput,
): Promise<CourseTopicRow> {
  const topic = await courseTopicRepo.findById(topicId);
  if (!topic) throw new TopicNotFoundError(topicId);

  const isOwner = await courseTopicRepo.isCourseOwner(topic.courseId, teacherId);
  if (!isOwner) throw new CourseNotFoundError(topic.courseId);

  const validated = validateInput({ ...input });
  return courseTopicRepo.update(topicId, validated);
}

export async function deleteTopic(
  teacherId: string,
  topicId: string,
): Promise<{ success: true; courseId: string }> {
  const topic = await courseTopicRepo.findById(topicId);
  if (!topic) throw new TopicNotFoundError(topicId);

  const isOwner = await courseTopicRepo.isCourseOwner(topic.courseId, teacherId);
  if (!isOwner) throw new CourseNotFoundError(topic.courseId);

  return prisma.$transaction(async (tx) => {
    const deleted = await courseTopicRepo.deleteById(topicId, tx);
    // Qolgan topic'larni qayta normalizatsiya qilish
    const remaining = await tx.courseTopic.findMany({
      where: { courseId: deleted.courseId },
      orderBy: { orderIndex: 'asc' },
      select: { id: true },
    });
    await courseTopicRepo.reorder(
      deleted.courseId,
      remaining.map((r) => r.id),
      tx,
    );
    return { success: true as const, courseId: deleted.courseId };
  });
}

export async function moveTopic(
  teacherId: string,
  topicId: string,
  direction: 'up' | 'down',
): Promise<{ moved: boolean }> {
  const topic = await courseTopicRepo.findById(topicId);
  if (!topic) throw new TopicNotFoundError(topicId);

  const isOwner = await courseTopicRepo.isCourseOwner(topic.courseId, teacherId);
  if (!isOwner) throw new CourseNotFoundError(topic.courseId);

  return prisma.$transaction((tx) => courseTopicRepo.move(topicId, direction, tx));
}

export async function reorderTopics(
  teacherId: string,
  courseId: string,
  orderedTopicIds: string[],
): Promise<{ success: true }> {
  const isOwner = await courseTopicRepo.isCourseOwner(courseId, teacherId);
  if (!isOwner) throw new CourseNotFoundError(courseId);

  // ID'lar shu kursga tegishli ekanini tekshirish
  const existing = await prisma.courseTopic.findMany({
    where: { courseId, id: { in: orderedTopicIds } },
    select: { id: true },
  });
  if (existing.length !== orderedTopicIds.length) {
    throw new ValidationError("Topic ID'larida xatolik");
  }

  await prisma.$transaction((tx) =>
    courseTopicRepo.reorder(courseId, orderedTopicIds, tx),
  );
  return { success: true as const };
}
