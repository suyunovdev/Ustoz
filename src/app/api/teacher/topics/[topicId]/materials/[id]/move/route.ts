/**
 * POST /api/teacher/topics/[topicId]/materials/[id]/move
 *
 * Material'ni boshqa topic'ga ko'chirish.
 * Body: { destinationTopicId: string }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  moveMaterial,
  MaterialNotFoundError,
  TopicAccessDeniedError,
} from '@/lib/services/content-material.service';
import { ValidationError } from '@/lib/errors';

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
    const dest = (body as { destinationTopicId?: unknown })?.destinationTopicId;
    if (typeof dest !== 'string' || !dest) {
      throw new ValidationError("destinationTopicId majburiy");
    }

    const result = await moveMaterial(id, session.sub, dest);
    return jsonResponse({ material: serialize(result) });
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
