/**
 * GET /api/certificates/[id]
 * Bitta sertifikat ma'lumoti yoki PDF yuklab olish.
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { certificateRepo } from '@/lib/repositories';

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

    // Faqat o'z sertifikati yoki admin
    if (cert.studentId !== session.sub && session.role !== 'admin') {
      return jsonResponse({ error: 'Ruxsat yo\'q' }, { status: 403 });
    }

    return jsonResponse({ certificate: cert });
  } catch (err) {
    return errorResponse(err);
  }
}
