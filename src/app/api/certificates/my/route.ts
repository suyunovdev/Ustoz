/**
 * GET /api/certificates/my
 * Talabaning barcha sertifikatlari.
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { certificateRepo } from '@/lib/repositories';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const certs = await certificateRepo.findByStudent(session.sub);
    return jsonResponse({
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
