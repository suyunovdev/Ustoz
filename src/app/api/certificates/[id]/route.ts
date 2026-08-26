/**
 * GET /api/certificates/[id]
 * Bitta sertifikat ma'lumoti yoki PDF yuklab olish.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { certificateRepo } from '@/lib/repositories';
import { hasActiveSubscription } from '@/lib/services/subscription.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth(req);
    const { id } = await params;

    const cert = await certificateRepo.findById(id);
    if (!cert) {
      return jsonResponse({ error: 'Sertifikat topilmadi' }, { status: 404 });
    }

    const isOwner = cert.studentId === session.sub;
    const isAdmin = session.role === 'admin';

    // Faqat o'z sertifikati yoki admin
    if (!isOwner && !isAdmin) {
      return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }

    // Obuna gate: rasmiy sertifikat (to'liq ko'rinish/yuklash/ulashish) faqat
    // faol obunachi uchun. Admin bundan mustasno. Yozuvning o'zi bo'lgani uchun,
    // obuna qilinsa sertifikat darhol ochiladi. Public tekshiruv (/verify/[raqam])
    // bundan mustasno — u ochiq qoladi.
    if (isOwner && !isAdmin) {
      const subscribed = await hasActiveSubscription(session.sub);
      if (!subscribed) {
        const c = cert as {
          courseTitleSnapshot?: string | null;
          course?: { title?: string };
          issuedAt: Date;
          certificateNumber: string;
        };
        return jsonResponse({
          locked: true,
          code: 'SUBSCRIPTION_REQUIRED',
          preview: {
            courseTitle: c.course?.title ?? c.courseTitleSnapshot ?? '',
            issuedAt: c.issuedAt,
            certificateNumber: c.certificateNumber,
          },
        });
      }
    }

    return jsonResponse({ certificate: cert });
  } catch (err) {
    return errorResponse(err);
  }
}
