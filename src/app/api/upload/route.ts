/**
 * POST /api/upload
 *
 * Universal fayl yuklash endpoint.
 * - R2 sozlangan bo'lsa → R2 ga yuklaydi
 * - R2 yo'q bo'lsa → base64 data URL qaytaradi (dev/demo uchun)
 *
 * Form data: file (File), topicId? (string)
 * Response: { url, fileName, fileSize, contentType }
 */

import type { NextRequest } from 'next/server';
import { requireTeacherOrAdmin, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { isR2Configured, createPresignedUpload } from '@/lib/storage/r2-client';

const MAX_SIZE = 50 * 1024 * 1024; // 50MB server upload limit

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/mp3',
  'text/plain',
]);

export async function POST(req: NextRequest) {
  try {
    const session = await requireTeacherOrAdmin(req);
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const topicId = (formData.get('topicId') as string) || 'general';

    if (!file) {
      return jsonResponse({ error: 'Fayl tanlanmagan' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return jsonResponse({ error: `Fayl hajmi ${MAX_SIZE / 1024 / 1024}MB dan oshmasligi kerak` }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonResponse({ error: `Bu fayl turi qabul qilinmaydi: ${file.type}` }, { status: 400 });
    }

    // R2 sozlangan bo'lsa — presigned URL qaytarish
    if (isR2Configured()) {
      const result = await createPresignedUpload({
        teacherId: session.sub,
        topicId,
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      // Server-side upload to R2
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadRes = await fetch(result.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: buffer,
      });

      if (!uploadRes.ok) {
        return jsonResponse({ error: 'R2 ga yuklashda xatolik' }, { status: 502 });
      }

      return jsonResponse({
        url: result.publicUrl,
        r2Key: result.r2Key,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type,
        storage: 'r2',
      });
    }

    // R2 yo'q — base64 data URL (dev/demo uchun, kichik fayllar)
    if (file.size > 5 * 1024 * 1024) {
      return jsonResponse(
        { error: 'R2 sozlanmagan. Base64 rejimida faqat 5MB gacha fayllar qabul qilinadi.' },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return jsonResponse({
      url: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type,
      storage: 'base64',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
