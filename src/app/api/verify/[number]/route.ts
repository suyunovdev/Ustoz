/**
 * GET /api/verify/[number]
 * Public — sertifikatni raqami orqali tekshirish (anonim).
 */

import type { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  verifyPublic,
  CertificateNotFoundError,
} from '@/lib/services/certificate.service';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  try {
    const { number } = await params;
    const certificate = await verifyPublic(number);
    return jsonResponse({ certificate });
  } catch (err) {
    if (err instanceof CertificateNotFoundError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
