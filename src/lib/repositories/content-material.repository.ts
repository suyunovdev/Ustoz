/**
 * Content Material repository — `content_materials` jadvali uchun.
 *
 * Material turlari (materialType):
 *   - 'video'         — Cloudflare Stream, YouTube, Vimeo URL
 *   - 'document'      — PDF, DOCX URL
 *   - 'audio'         — MP3/WAV URL
 *   - 'image'         — PNG/JPG URL
 *   - 'external_link' — har qanday tashqi havola
 *
 * status: 'active' | 'archived'
 */

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

type PrismaLike = Prisma.TransactionClient | typeof prisma;

export type MaterialType = 'video' | 'document' | 'audio' | 'image' | 'external_link';

export type ContentMaterialRow = {
  id: string;
  teacherId: string;
  courseId: string | null;
  topicId: string | null;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: bigint | null;
  fileType: string | null;
  materialType: string;
  status: string;
  viewCount: number;
  storageType: string;
  r2Key: string | null;
  currentVersion: number;
  createdAt: Date;
};

export async function findByTopic(topicId: string): Promise<ContentMaterialRow[]> {
  return prisma.contentMaterial.findMany({
    where: { topicId, status: 'active' },
    orderBy: { createdAt: 'asc' },
  });
}

export async function findById(id: string): Promise<ContentMaterialRow | null> {
  return prisma.contentMaterial.findUnique({ where: { id } });
}

export interface CreateMaterialInput {
  teacherId: string;
  courseId: string;
  topicId: string;
  title: string;
  description?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: bigint | null;
  fileType?: string | null;
  materialType: MaterialType;
  storageType?: 'external' | 'r2';
  r2Key?: string | null;
}

export async function create(
  input: CreateMaterialInput,
  tx?: Prisma.TransactionClient,
): Promise<ContentMaterialRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.contentMaterial.create({
    data: {
      teacherId: input.teacherId,
      courseId: input.courseId,
      topicId: input.topicId,
      title: input.title,
      description: input.description ?? null,
      fileUrl: input.fileUrl ?? null,
      fileName: input.fileName ?? null,
      fileSize: input.fileSize ?? null,
      fileType: input.fileType ?? null,
      materialType: input.materialType,
      status: 'active',
      storageType: input.storageType ?? 'external',
      r2Key: input.r2Key ?? null,
    },
  });
}

export interface UpdateMaterialInput {
  title?: string;
  description?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: bigint | null;
  fileType?: string | null;
  materialType?: MaterialType;
  status?: string;
}

export async function update(
  id: string,
  data: UpdateMaterialInput,
  tx?: Prisma.TransactionClient,
): Promise<ContentMaterialRow> {
  const client: PrismaLike = tx ?? prisma;
  return client.contentMaterial.update({
    where: { id },
    data,
  });
}

export async function softDelete(
  id: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  await client.contentMaterial.update({
    where: { id },
    data: { status: 'archived' },
  });
}

export async function hardDelete(
  id: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client: PrismaLike = tx ?? prisma;
  await client.contentMaterial.delete({ where: { id } });
}

/**
 * Topic ushbu teacher'ga tegishliligini tekshirish (course teacher_id orqali).
 */
export async function isTopicOwner(
  topicId: string,
  teacherId: string,
): Promise<{ ok: boolean; courseId: string | null }> {
  const topic = await prisma.courseTopic.findUnique({
    where: { id: topicId },
    include: { course: { select: { teacherId: true, id: true } } },
  });
  if (!topic) return { ok: false, courseId: null };
  return {
    ok: topic.course.teacherId === teacherId,
    courseId: topic.course.id,
  };
}

/**
 * Material'ni boshqa topic'ga ko'chirish.
 * Yangi topic ham xuddi shu teacher'ga tegishli bo'lishi shart — bu service'da tekshiriladi.
 */
export async function moveToTopic(
  materialId: string,
  newTopicId: string,
  newCourseId: string,
): Promise<ContentMaterialRow> {
  return prisma.contentMaterial.update({
    where: { id: materialId },
    data: { topicId: newTopicId, courseId: newCourseId },
  });
}

// ==================== VERSIONING ====================

export interface MaterialVersionRow {
  id: string;
  materialId: string;
  version: number;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: bigint | null;
  fileType: string | null;
  materialType: string | null;
  replacedAt: Date;
  replacedBy: string;
}

export async function listVersions(materialId: string): Promise<MaterialVersionRow[]> {
  return prisma.materialVersion.findMany({
    where: { materialId },
    orderBy: { version: 'desc' },
  });
}

export interface ReplaceMaterialInput {
  newFileUrl: string;
  newFileName?: string | null;
  newFileSize?: bigint | null;
  newFileType?: string | null;
  newMaterialType?: MaterialType;
  replacedBy: string;
}

/**
 * Material file'ini almashtirish.
 * Eski versiyani `material_versions` ga arxivlaydi, asosiy yozuvni yangilaydi,
 * current_version'ni oshiradi. Hamma narsa bitta transaction ichida.
 */
export async function replaceFile(
  materialId: string,
  input: ReplaceMaterialInput,
): Promise<ContentMaterialRow> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.contentMaterial.findUnique({ where: { id: materialId } });
    if (!current) throw new Error('Material not found');

    await tx.materialVersion.create({
      data: {
        materialId,
        version: current.currentVersion,
        fileUrl: current.fileUrl,
        fileName: current.fileName,
        fileSize: current.fileSize,
        fileType: current.fileType,
        materialType: current.materialType,
        replacedBy: input.replacedBy,
      },
    });

    return tx.contentMaterial.update({
      where: { id: materialId },
      data: {
        fileUrl: input.newFileUrl,
        fileName: input.newFileName ?? null,
        fileSize: input.newFileSize ?? null,
        fileType: input.newFileType ?? null,
        materialType: input.newMaterialType ?? current.materialType,
        currentVersion: { increment: 1 },
      },
    });
  });
}

// ==================== VIEW TRACKING ====================

export interface RecordViewInput {
  materialId: string;
  studentId?: string | null;
  watchSec?: number | null;
  ipAddress?: string | null;
}

/**
 * Material ko'rilganini yozish + view_count'ni atomik oshirish.
 * Transactional — view_count drift'ini oldini oladi.
 */
export async function recordView(input: RecordViewInput): Promise<void> {
  await prisma.$transaction([
    prisma.materialView.create({
      data: {
        materialId: input.materialId,
        studentId: input.studentId ?? null,
        watchSec: input.watchSec ?? null,
        ipAddress: input.ipAddress ?? null,
      },
    }),
    prisma.contentMaterial.update({
      where: { id: input.materialId },
      data: { viewCount: { increment: 1 } },
    }),
  ]);
}

export interface MaterialViewStats {
  materialId: string;
  totalViews: number;
  uniqueViewers: number;
  avgWatchSec: number | null;
  last7Days: number;
}

export async function getViewStats(materialId: string): Promise<MaterialViewStats> {
  const [total, unique, avgWatch, last7] = await Promise.all([
    prisma.materialView.count({ where: { materialId } }),
    prisma.materialView
      .findMany({
        where: { materialId, studentId: { not: null } },
        select: { studentId: true },
        distinct: ['studentId'],
      })
      .then((rows) => rows.length),
    prisma.materialView
      .aggregate({ where: { materialId, watchSec: { not: null } }, _avg: { watchSec: true } })
      .then((r) => r._avg.watchSec),
    prisma.materialView.count({
      where: {
        materialId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);
  return {
    materialId,
    totalViews: total,
    uniqueViewers: unique,
    avgWatchSec: avgWatch !== null && avgWatch !== undefined ? Math.round(avgWatch) : null,
    last7Days: last7,
  };
}
