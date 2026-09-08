/**
 * GET /api/teacher/bunny/status?guid=... — Bunny video qayta ishlash holati.
 * Faqat teacher/admin. Yuklashdan keyin "qayta ishlanmoqda → tayyor" ni kuzatish uchun.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getVideoStatus, BunnyError } from '@/lib/storage/bunny-stream';

export async function GET(req: NextRequest) {
  try {
    await requireTeacherOrAdmin(req);
    const guid = new URL(req.url).searchParams.get('guid');
    if (!guid || !/^[a-zA-Z0-9-]{8,}$/.test(guid)) {
      return jsonResponse({ error: "Noto'g'ri video ID" }, { status: 400 });
    }
    const s = await getVideoStatus(guid);
    return jsonResponse(s);
  } catch (err) {
    if (err instanceof BunnyError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 502 });
    }
    return errorResponse(err);
  }
}
