/**
 * POST /api/teacher/topics/[topicId]/materials/[id]/replace
 *
 * Material file'ini almashtirish. Eski versiya material_versions ga arxivlanadi.
 *
 * Body: {
 *   newFileUrl: string (majburiy),
 *   newFileName?, newFileSize?, newFileType?, newMaterialType?
 * }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  replaceMaterial,
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

export async function POST(
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
    const b = (body ?? {}) as Record<string, unknown>;
    const newFileUrl = typeof b.newFileUrl === 'string' ? b.newFileUrl : '';
    if (!newFileUrl) throw new ValidationError("newFileUrl majburiy");

    const newMaterialType =
      typeof b.newMaterialType === 'string' &&
      VALID_TYPES.includes(b.newMaterialType as MaterialType)
        ? (b.newMaterialType as MaterialType)
        : undefined;

    const updated = await replaceMaterial(id, session.sub, {
      newFileUrl,
      newFileName: typeof b.newFileName === 'string' ? b.newFileName : undefined,
      newFileSize:
        typeof b.newFileSize === 'number'
          ? b.newFileSize
          : typeof b.newFileSize === 'string'
          ? Number(b.newFileSize)
          : undefined,
      newFileType: typeof b.newFileType === 'string' ? b.newFileType : undefined,
      newMaterialType,
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
