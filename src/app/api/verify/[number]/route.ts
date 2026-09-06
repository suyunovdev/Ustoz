/**
 * GET /api/verify/[number]
 * Public — sertifikatni raqami orqali tekshirish (anonim).
 */

import type { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  verifyPublic,
  CertificateNotFoundError,
} from '@/lib/services/certificate.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  try {
    // Sertifikat raqamini brute-force/enumeration'dan himoya (IP bo'yicha 30/daqiqa).
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
    const rl = await checkRateLimit(`verify:${ip}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return jsonResponse({ error: 'Juda ko\'p so\'rov. Bir oz kuting.' }, { status: 429, headers: { 'Retry-After': '60' } });
    }

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
