/**
 * POST /api/upload/bunny
 *
 * Himoyalangan dars videosi uchun Bunny Stream TUS (resumable) yuklash
 * parametrlari. Client tus-js-client bilan to'g'ridan-to'g'ri Bunny'ga yuklaydi —
 * katta fayl bizning serverdan o'tmaydi, API kaliti clientga chiqmaydi (faqat imzo).
 *
 * Faqat teacher/admin. Bunny sozlanmagan bo'lsa 503.
 *
 * Body (ixtiyoriy): { title?: string }
 * Response: { videoGuid, libraryId, endpoint, authorizationSignature, authorizationExpire }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { isBunnyConfigured, createTusUpload, BunnyError } from '@/lib/storage/bunny-stream';

export async function POST(req: NextRequest) {
  try {
    await requireTeacherOrAdmin(req);

    if (!(await isBunnyConfigured())) {
      return jsonResponse(
        { error: 'Video xizmati (Bunny Stream) sozlanmagan', code: 'BUNNY_NOT_CONFIGURED' },
        { status: 503 },
      );
    }

    let title = 'Dars videosi';
    try {
      const body = (await req.json()) as Record<string, unknown>;
      if (typeof body.title === 'string' && body.title.trim()) title = body.title.trim().slice(0, 200);
    } catch {
      /* body ixtiyoriy */
    }

    const result = await createTusUpload(title);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof BunnyError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 502 });
    }
    return errorResponse(err);
  }
}
