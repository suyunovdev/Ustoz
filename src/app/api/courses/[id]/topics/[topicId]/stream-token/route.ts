/**
 * POST /api/courses/[id]/topics/[topicId]/stream-token
 *
 * Himoyalangan Bunny Stream videosi uchun qisqa muddatli imzolangan embed URL.
 * FAQAT kirish huquqi tasdiqlangandan keyin beriladi:
 *   - kursga faol yozilgan (enrollment/obuna) O'QUVCHI, yoki
 *   - kurs egasi (teacher), yoki admin, yoki
 *   - mavzu bepul namuna (isFreePreview) bo'lsa — har qanday login'li foydalanuvchi.
 *
 * Bu `GET /api/courses/[id]` dagi `hasFullAccess` mantig'i bilan aynan bir xil.
 * Bunny kutubxonasida "Token Authentication" yoqilgani uchun bu imzolangan
 * URL'siz (yoki sizib chiqqan GUID bilan) videoni ochib bo'lmaydi.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { prisma } from '@/lib/prisma';
import { hasActiveCourseAccess } from '@/lib/services/subscription.service';
import {
  isBunnySigningConfigured,
  signEmbedUrl,
  BunnyError,
} from '@/lib/storage/bunny-stream';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TTL_SEC = 2 * 60 * 60; // 2 soat

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; topicId: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id, topicId } = await params;

    if (!UUID_RE.test(id) || !UUID_RE.test(topicId)) {
      return jsonResponse({ error: "Noto'g'ri ID formati" }, { status: 400 });
    }

    const topic = await prisma.courseTopic.findFirst({
      where: { id: topicId, courseId: id },
      select: {
        streamUid: true,
        videoProvider: true,
        isFreePreview: true,
        course: { select: { teacherId: true } },
      },
    });
    if (!topic) {
      return jsonResponse({ error: 'Mavzu topilmadi' }, { status: 404 });
    }
    if (topic.videoProvider !== 'bunny' || !topic.streamUid) {
      return jsonResponse(
        { error: 'Bu mavzuda himoyalangan video yo\'q', code: 'NOT_PROTECTED_VIDEO' },
        { status: 400 },
      );
    }

    // Kirish tekshiruvi — GET /api/courses/[id]:53-64 bilan izchil.
    const isOwner = topic.course.teacherId === session.sub;
    const isAdmin = session.role === 'admin';
    const enrolled = isOwner || isAdmin ? true : await hasActiveCourseAccess(session.sub, id);
    if (!enrolled && !isOwner && !isAdmin && !topic.isFreePreview) {
      return jsonResponse({ error: 'Kursga kirish huquqingiz yo\'q', code: 'FORBIDDEN' }, { status: 403 });
    }

    if (!(await isBunnySigningConfigured())) {
      return jsonResponse(
        { error: 'Video imzolash sozlanmagan', code: 'BUNNY_SIGNING_NOT_CONFIGURED' },
        { status: 503 },
      );
    }

    const { embedUrl, expires } = await signEmbedUrl(topic.streamUid, TTL_SEC);
    return jsonResponse({ embedUrl, expiresAt: expires * 1000 });
  } catch (err) {
    if (err instanceof BunnyError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 502 });
    }
    return errorResponse(err);
  }
}
