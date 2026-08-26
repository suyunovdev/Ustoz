/**
 * GET /api/certificates/my
 * Talabaning barcha sertifikatlari.
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { certificateRepo } from '@/lib/repositories';
import { hasActiveSubscription } from '@/lib/services/subscription.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const [certs, subscribed] = await Promise.all([
      certificateRepo.findByStudent(session.sub),
      hasActiveSubscription(session.sub),
    ]);
    // `subscribed` — rasmiy sertifikatni ko'rish/yuklash/ulashish obuna bilan
    // ochiladi. Yozuvning o'zi (tugatish) hammaga ko'rinadi.
    return jsonResponse({
      subscribed,
      certificates: certs.map((c) => ({
        id: c.id,
        courseId: c.courseId,
        courseTitle: (c as { course?: { title?: string } }).course?.title ?? '',
        certificateNumber: c.certificateNumber,
        issuedAt: c.issuedAt.toISOString(),
        verificationUrl: c.verificationUrl,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
