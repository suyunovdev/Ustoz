/**
 * Content Material Service
 * ------------------------
 * Teacher tomonidan topic'larga material qo'shish/o'zgartirish.
 *
 * Hozir: faqat URL-based (teacher tashqi platform'da hosting qiladi).
 * Kelajak: Cloudflare R2 ga to'g'ridan-to'g'ri upload + presigned URL.
 */

import {
  contentMaterialRepo,
  type ContentMaterialRow,
  type MaterialType,
} from '@/lib/repositories';
import { ValidationError } from '@/lib/errors';

export class MaterialNotFoundError extends Error {
  code = 'MATERIAL_NOT_FOUND';
  constructor(id: string) {
    super(`Material not found: ${id}`);
    this.name = 'MaterialNotFoundError';
  }
}

export class TopicAccessDeniedError extends Error {
  code = 'TOPIC_ACCESS_DENIED';
  constructor() {
    super("Bu mavzu sizniki emas");
    this.name = 'TopicAccessDeniedError';
  }
}

const VALID_MATERIAL_TYPES = new Set<MaterialType>([
  'video',
  'document',
  'audio',
  'image',
  'external_link',
]);

export async function listMaterials(
  topicId: string,
  teacherId: string,
): Promise<ContentMaterialRow[]> {
  const access = await contentMaterialRepo.isTopicOwner(topicId, teacherId);
  if (!access.ok) throw new TopicAccessDeniedError();
  return contentMaterialRepo.findByTopic(topicId);
}

interface AddMaterialInput {
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number | bigint;
  fileType?: string;
  materialType: MaterialType;
  storageType?: 'external' | 'r2';
  r2Key?: string;
}

function validateInput(input: AddMaterialInput): void {
  const title = input.title.trim();
  if (title.length < 2) throw new ValidationError("Material nomi kamida 2 belgi");
  if (title.length > 200) throw new ValidationError("Material nomi 200 belgidan oshmasin");
  if (!VALID_MATERIAL_TYPES.has(input.materialType)) {
    throw new ValidationError(`Noto'g'ri tur: ${input.materialType}`);
  }
  if (input.fileUrl) {
    try {
      new URL(input.fileUrl);
    } catch {
      throw new ValidationError("Yaroqsiz URL");
    }
  }
}

export async function addMaterial(
  topicId: string,
  teacherId: string,
  input: AddMaterialInput,
): Promise<ContentMaterialRow> {
  const access = await contentMaterialRepo.isTopicOwner(topicId, teacherId);
  if (!access.ok || !access.courseId) throw new TopicAccessDeniedError();

  validateInput(input);

  return contentMaterialRepo.create({
    teacherId,
    courseId: access.courseId,
    topicId,
    title: input.title.trim(),
    description: input.description?.trim() ?? null,
    fileUrl: input.fileUrl ?? null,
    fileName: input.fileName ?? null,
    fileSize: input.fileSize !== undefined ? BigInt(input.fileSize) : null,
    fileType: input.fileType ?? null,
    materialType: input.materialType,
    storageType: input.storageType ?? 'external',
    r2Key: input.r2Key ?? null,
  });
}

export interface UpdateMaterialInput {
  title?: string;
  description?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  materialType?: MaterialType;
}

export async function updateMaterial(
  materialId: string,
  teacherId: string,
  input: UpdateMaterialInput,
): Promise<ContentMaterialRow> {
  const material = await contentMaterialRepo.findById(materialId);
  if (!material) throw new MaterialNotFoundError(materialId);

  // Owner check (teacher)
  if (material.teacherId !== teacherId) {
    throw new TopicAccessDeniedError();
  }

  if (input.title !== undefined) {
    const t = input.title.trim();
    if (t.length < 2) throw new ValidationError("Material nomi kamida 2 belgi");
    input.title = t;
  }
  if (input.materialType && !VALID_MATERIAL_TYPES.has(input.materialType)) {
    throw new ValidationError(`Noto'g'ri tur: ${input.materialType}`);
  }
  if (input.fileUrl) {
    try {
      new URL(input.fileUrl);
    } catch {
      throw new ValidationError("Yaroqsiz URL");
    }
  }

  return contentMaterialRepo.update(materialId, input);
}

export async function deleteMaterial(
  materialId: string,
  teacherId: string,
): Promise<{ success: true }> {
  const material = await contentMaterialRepo.findById(materialId);
  if (!material) throw new MaterialNotFoundError(materialId);
  if (material.teacherId !== teacherId) {
    throw new TopicAccessDeniedError();
  }
  await contentMaterialRepo.hardDelete(materialId);
  return { success: true as const };
}

// ==================== REPLACE / VERSIONING ====================

export interface ReplaceMaterialServiceInput {
  newFileUrl: string;
  newFileName?: string;
  newFileSize?: number | bigint;
  newFileType?: string;
  newMaterialType?: MaterialType;
}

export async function replaceMaterial(
  materialId: string,
  teacherId: string,
  input: ReplaceMaterialServiceInput,
) {
  const material = await contentMaterialRepo.findById(materialId);
  if (!material) throw new MaterialNotFoundError(materialId);
  if (material.teacherId !== teacherId) throw new TopicAccessDeniedError();

  try {
    new URL(input.newFileUrl);
  } catch {
    throw new ValidationError("Yaroqsiz URL");
  }
  if (input.newMaterialType && !VALID_MATERIAL_TYPES.has(input.newMaterialType)) {
    throw new ValidationError(`Noto'g'ri tur: ${input.newMaterialType}`);
  }

  return contentMaterialRepo.replaceFile(materialId, {
    newFileUrl: input.newFileUrl,
    newFileName: input.newFileName ?? null,
    newFileSize: input.newFileSize !== undefined ? BigInt(input.newFileSize) : null,
    newFileType: input.newFileType ?? null,
    newMaterialType: input.newMaterialType,
    replacedBy: teacherId,
  });
}

export async function listMaterialVersions(materialId: string, teacherId: string) {
  const material = await contentMaterialRepo.findById(materialId);
  if (!material) throw new MaterialNotFoundError(materialId);
  if (material.teacherId !== teacherId) throw new TopicAccessDeniedError();
  return contentMaterialRepo.listVersions(materialId);
}

// ==================== MOVE BETWEEN TOPICS ====================

/**
 * Material'ni boshqa topic'ga ko'chirish. Maqsad-topic ham xuddi shu
 * teacher'ga tegishli bo'lishi shart, aks holda TopicAccessDeniedError.
 */
export async function moveMaterial(
  materialId: string,
  teacherId: string,
  destinationTopicId: string,
) {
  const material = await contentMaterialRepo.findById(materialId);
  if (!material) throw new MaterialNotFoundError(materialId);
  if (material.teacherId !== teacherId) throw new TopicAccessDeniedError();

  const access = await contentMaterialRepo.isTopicOwner(destinationTopicId, teacherId);
  if (!access.ok || !access.courseId) throw new TopicAccessDeniedError();

  if (material.topicId === destinationTopicId) return material;

  return contentMaterialRepo.moveToTopic(materialId, destinationTopicId, access.courseId);
}
