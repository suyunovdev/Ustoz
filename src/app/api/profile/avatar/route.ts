/**
 * POST /api/profile/avatar — avatar yuklash uchun presigned URL (R2).
 *
 * Body: { fileName, contentType, fileSize }
 * Javob:
 *   R2 sozlangan  → { configured: true, uploadUrl, publicUrl } — client faylni to'g'ridan
 *                    R2'ga PUT qiladi, so'ng PATCH /api/profile { avatarUrl: publicUrl }.
 *   R2 sozlanmagan → { configured: false } — client resized data-URL fallback'ga o'tadi
 *                    (PATCH /api/profile { avatarUrl: <dataUrl> }).
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { ValidationError } from '@/lib/errors';
import { isR2Configured, createAvatarUpload } from '@/lib/storage/r2-client';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);

    if (!isR2Configured()) {
      return jsonResponse({ configured: false });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('JSON formatida xato');
    }
    const b = (body ?? {}) as Record<string, unknown>;
    if (typeof b.fileName !== 'string' || typeof b.contentType !== 'string' || typeof b.fileSize !== 'number') {
      throw new ValidationError("fileName, contentType, fileSize majburiy");
    }

    const result = await createAvatarUpload(session.sub, {
      fileName: b.fileName,
      contentType: b.contentType,
      fileSize: b.fileSize,
    });
    return jsonResponse({ configured: true, uploadUrl: result.uploadUrl, publicUrl: result.publicUrl });
  } catch (err) {
    return errorResponse(err);
  }
}
