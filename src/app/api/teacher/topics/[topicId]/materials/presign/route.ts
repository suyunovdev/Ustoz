/**
 * POST /api/teacher/topics/[topicId]/materials/presign
 *
 * R2'ga bevosita upload uchun presigned URL qaytaradi.
 * Frontend keyin shu URL'ga PUT qiladi va natija sifatida publicUrl'ni
 * /materials endpoint'iga POST qiladi (storageType='r2').
 *
 * Body: { fileName, contentType, fileSize }
 * Response: { uploadUrl, publicUrl, r2Key, expiresInSec }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import {
  createPresignedUpload,
  isR2Configured,
  R2ValidationError,
} from '@/lib/storage/r2-client';
import { contentMaterialRepo } from '@/lib/repositories';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ topicId: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { topicId } = await params;

    if (!isR2Configured()) {
      return jsonResponse(
        {
          error: "R2 storage sozlanmagan. R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET env'lar kerak.",
          code: 'R2_NOT_CONFIGURED',
        },
        { status: 503 },
      );
    }

    const access = await contentMaterialRepo.isTopicOwner(topicId, session.sub);
    if (!access.ok) {
      return jsonResponse({ error: "Bu mavzu sizniki emas", code: 'TOPIC_ACCESS_DENIED' }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const b = (body ?? {}) as Record<string, unknown>;
    const fileName = typeof b.fileName === 'string' ? b.fileName : '';
    const contentType = typeof b.contentType === 'string' ? b.contentType : '';
    const fileSize = typeof b.fileSize === 'number' ? b.fileSize : 0;

    if (!fileName || !contentType || !fileSize) {
      throw new ValidationError("fileName, contentType, fileSize majburiy");
    }

    const result = await createPresignedUpload({
      teacherId: session.sub,
      topicId,
      fileName,
      contentType,
      fileSize,
    });

    return jsonResponse(result);
  } catch (err) {
    if (err instanceof R2ValidationError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 400 });
    }
    return errorResponse(err);
  }
}
