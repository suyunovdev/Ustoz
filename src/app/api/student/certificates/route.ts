/**
 * GET /api/student/certificates
 * Talabaning o'z sertifikatlari (active + revoked).
 */

import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listMy } from '@/lib/services/certificate.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const certificates = await listMy(session.sub);
    return jsonResponse({ certificates });
  } catch (err) {
    return errorResponse(err);
  }
}
