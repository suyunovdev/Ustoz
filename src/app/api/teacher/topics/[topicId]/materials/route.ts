/**
 * GET  /api/teacher/topics/[topicId]/materials — mavzu materiallari
 * POST /api/teacher/topics/[topicId]/materials — yangi material qo'shish
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  listMaterials,
  addMaterial,
  TopicAccessDeniedError,
} from '@/lib/services/content-material.service';
import { ValidationError, ForbiddenError } from '@/lib/errors';
import type { MaterialType } from '@/lib/repositories';

function serialize(rows: any[]) {
  return rows.map((r) => ({
    ...r,
    fileSize: r.fileSize !== null && r.fileSize !== undefined ? r.fileSize.toString() : null,
  }));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { topicId } = await params;
    const materials = await listMaterials(topicId, session.sub);
    return jsonResponse({ materials: serialize(materials) });
  } catch (err) {
    if (err instanceof TopicAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

const VALID_TYPES: ReadonlyArray<MaterialType> = [
  'video',
  'document',
  'audio',
  'image',
  'external_link',
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { topicId } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, unknown>;

    const materialType = b.materialType;
    if (typeof materialType !== 'string' || !VALID_TYPES.includes(materialType as MaterialType)) {
      throw new ValidationError(`Noto'g'ri material turi: ${String(materialType)}`);
    }

    const storageType =
      b.storageType === 'r2' ? 'r2' : 'external';

    const material = await addMaterial(topicId, session.sub, {
      title: typeof b.title === 'string' ? b.title : '',
      description: typeof b.description === 'string' ? b.description : undefined,
      fileUrl: typeof b.fileUrl === 'string' ? b.fileUrl : undefined,
      fileName: typeof b.fileName === 'string' ? b.fileName : undefined,
      fileSize:
        typeof b.fileSize === 'number'
          ? b.fileSize
          : typeof b.fileSize === 'string'
          ? Number(b.fileSize)
          : undefined,
      fileType: typeof b.fileType === 'string' ? b.fileType : undefined,
      materialType: materialType as MaterialType,
      storageType,
      r2Key: typeof b.r2Key === 'string' ? b.r2Key : undefined,
    });

    return jsonResponse({ material: serialize([material])[0] });
  } catch (err) {
    if (err instanceof TopicAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
