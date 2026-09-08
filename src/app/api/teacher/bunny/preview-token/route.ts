/**
 * POST /api/teacher/bunny/preview-token — o'qituvchi kurs yaratishda video'ni
 * ko'rib tekshirishi uchun qisqa muddatli imzolangan embed URL.
 * Faqat teacher/admin. GUID faqat yuklagan o'qituvchida bo'ladi (maxfiy).
 *
 * Body: { videoGuid: string }
 * Response: { embedUrl, expiresAt }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { isBunnySigningConfigured, signEmbedUrl, BunnyError } from '@/lib/storage/bunny-stream';

export async function POST(req: NextRequest) {
  try {
    await requireTeacherOrAdmin(req);

    let guid = '';
    try {
      const body = (await req.json()) as Record<string, unknown>;
      if (typeof body.videoGuid === 'string') guid = body.videoGuid.trim();
    } catch {
      /* noop */
    }
    if (!/^[a-zA-Z0-9-]{8,}$/.test(guid)) {
      return jsonResponse({ error: "Noto'g'ri video ID" }, { status: 400 });
    }

    if (!(await isBunnySigningConfigured())) {
      return jsonResponse(
        { error: 'Video imzolash sozlanmagan', code: 'BUNNY_SIGNING_NOT_CONFIGURED' },
        { status: 503 },
      );
    }

    const { embedUrl, expires } = await signEmbedUrl(guid, 60 * 60); // 1 soat (preview)
    return jsonResponse({ embedUrl, expiresAt: expires * 1000 });
  } catch (err) {
    if (err instanceof BunnyError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 502 });
    }
    return errorResponse(err);
  }
}
