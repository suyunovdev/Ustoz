/**
 * PATCH  /api/teacher/topics/[topicId]/materials/[id] — material'ni tahrirlash
 * DELETE /api/teacher/topics/[topicId]/materials/[id] — material'ni o'chirish
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  updateMaterial,
  deleteMaterial,
  MaterialNotFoundError,
  TopicAccessDeniedError,
} from '@/lib/services/content-material.service';
import { ValidationError } from '@/lib/errors';
import type { MaterialType } from '@/lib/repositories';

const VALID_TYPES: ReadonlyArray<MaterialType> = [
  'video',
  'document',
  'audio',
  'image',
  'external_link',
];

function serialize(row: any) {
  return {
    ...row,
    fileSize: row.fileSize !== null && row.fileSize !== undefined ? row.fileSize.toString() : null,
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    if (!body || typeof body !== 'object') throw new ValidationError("Body bo'sh");
    const b = body as Record<string, unknown>;

    const materialType =
      typeof b.materialType === 'string' && VALID_TYPES.includes(b.materialType as MaterialType)
        ? (b.materialType as MaterialType)
        : undefined;

    const updated = await updateMaterial(id, session.sub, {
      title: typeof b.title === 'string' ? b.title : undefined,
      description:
        b.description === null
          ? null
          : typeof b.description === 'string'
          ? b.description
          : undefined,
      fileUrl:
        b.fileUrl === null
          ? null
          : typeof b.fileUrl === 'string'
          ? b.fileUrl
          : undefined,
      fileName:
        b.fileName === null
          ? null
          : typeof b.fileName === 'string'
          ? b.fileName
          : undefined,
      fileType:
        b.fileType === null
          ? null
          : typeof b.fileType === 'string'
          ? b.fileType
          : undefined,
      materialType,
    });

    return jsonResponse({ material: serialize(updated) });
  } catch (err) {
    if (err instanceof MaterialNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof TopicAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;
    const result = await deleteMaterial(id, session.sub);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof MaterialNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    if (err instanceof TopicAccessDeniedError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 403 });
    }
    return errorResponse(err);
  }
}
