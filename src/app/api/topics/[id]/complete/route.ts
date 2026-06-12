/**
 * POST /api/topics/[id]/complete
 *
 * Student bitta topic'ni tugatdi.
 * Idempotent — takror chaqirsangiz xato emas, `wasAlreadyCompleted: true`.
 *
 * Auth: JWT (student role majburiy)
 * Body: yo'q
 *
 * Response:
 *   200 {
 *     success: true,
 *     progress: number,
 *     isCourseCompleted: boolean,
 *     wasAlreadyCompleted: boolean,
 *     shouldShowCertificateModal?: boolean  // faqat birinchi marta 100% bo'lganda
 *   }
 *   401 — Auth yo'q
 *   403 — Role student emas / kursga yozilmagan
 *   404 — Topic topilmadi
 *   500 — Server xatosi
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { jsonResponse } from '@/lib/json';
import { markTopicComplete } from '@/lib/services/progress.service';
import {
  EnrollmentNotFoundError,
  TopicNotFoundError,
  isServiceError,
} from '@/lib/errors';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse(
      { error: 'Autentifikatsiya talab qilinadi' },
      { status: 401 },
    );
  }

  if (session.role !== 'student') {
    return jsonResponse(
      { error: 'Faqat talabalar uchun' },
      { status: 403 },
    );
  }

  const { id: topicId } = await params;

  try {
    const result = await markTopicComplete(session.sub, topicId);

    // Kurs 100% tugaganda sertifikat avtomatik beriladi (progress.service.ts ichida).
    // UI'da modal ko'rsatish uchun belgilab qaytaramiz.
    const shouldShowCertificateModal = result.isCourseCompleted;

    return jsonResponse({
      success: true,
      progress: result.progress,
      isCourseCompleted: result.isCourseCompleted,
      wasAlreadyCompleted: result.wasAlreadyCompleted,
      ...(shouldShowCertificateModal ? { shouldShowCertificateModal: true } : {}),
    });
  } catch (err) {
    if (err instanceof TopicNotFoundError) {
      return jsonResponse({ error: 'Mavzu topilmadi' }, { status: 404 });
    }
    if (err instanceof EnrollmentNotFoundError) {
      return jsonResponse(
        { error: "Avval kursga yoziling" },
        { status: 403 },
      );
    }
    if (isServiceError(err)) {
      return jsonResponse(
        { error: err.message, code: err.code },
        { status: 400 },
      );
    }
    console.error('[POST /api/topics/[id]/complete]', err);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
