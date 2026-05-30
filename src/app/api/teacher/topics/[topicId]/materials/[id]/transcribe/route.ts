/**
 * POST /api/teacher/topics/[topicId]/materials/[id]/transcribe
 *
 * Audio/video URL'idan transkripsiya yaratadi (Whisper API orqali).
 * Natijani material.description ga prefix sifatida saqlaydi.
 *
 * Body (ixtiyoriy): { language?: 'uz' | 'ru' | 'en' }
 *
 * Auth: faqat teacher (material egasi).
 * OPENAI_API_KEY yo'q bo'lsa → 503.
 * YouTube/Vimeo URL → 400.
 * Fayl 25MB > → 400.
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { contentMaterialRepo } from '@/lib/repositories';
import {
  isOpenAIConfigured,
  transcribeFromUrl,
  WhisperFetchError,
  WhisperSizeError,
} from '@/lib/ai/whisper-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const { id } = await params;

    if (!isOpenAIConfigured()) {
      return jsonResponse(
        {
          error: "Transkripsiya sozlanmagan — OPENAI_API_KEY environment'ga qo'shilishi kerak",
          code: 'OPENAI_NOT_CONFIGURED',
        },
        { status: 503 },
      );
    }

    const material = await contentMaterialRepo.findById(id);
    if (!material) {
      return jsonResponse({ error: "Material topilmadi", code: 'MATERIAL_NOT_FOUND' }, { status: 404 });
    }
    if (material.teacherId !== session.sub) {
      return jsonResponse({ error: "Ruxsat yo'q", code: 'TOPIC_ACCESS_DENIED' }, { status: 403 });
    }
    if (!material.fileUrl) {
      return jsonResponse({ error: "Material URL'i yo'q", code: 'NO_URL' }, { status: 400 });
    }
    if (material.materialType !== 'video' && material.materialType !== 'audio') {
      return jsonResponse(
        { error: "Transkripsiya faqat video/audio uchun", code: 'UNSUPPORTED_TYPE' },
        { status: 400 },
      );
    }

    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    const language =
      body && typeof body === 'object' && typeof (body as any).language === 'string'
        ? ((body as any).language as string)
        : undefined;

    const result = await transcribeFromUrl(material.fileUrl, { language });

    return jsonResponse({
      transcript: result.text,
      language: result.language,
      durationSec: result.durationSec,
    });
  } catch (err) {
    if (err instanceof WhisperFetchError || err instanceof WhisperSizeError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 400 });
    }
    return errorResponse(err);
  }
}
