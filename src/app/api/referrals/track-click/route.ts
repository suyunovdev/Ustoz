/**
 * POST /api/referrals/track-click
 * Public — anonim foydalanuvchi referral linkga bosganda chaqiriladi.
 * Body: { code: string }
 */

import type { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import {
  trackClick,
  InvalidReferralCodeError,
} from '@/lib/services/referral.service';
import { ValidationError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("JSON formatida xato");
    }
    const code = typeof (body as any)?.code === 'string' ? (body as any).code : '';
    if (!code) throw new ValidationError("code majburiy");

    // Klik metrikasini shishirishning oldini olish — IP+kod bo'yicha soatiga 5 marta
    const ip = getClientIp(req);
    const rl = await checkRateLimit(`refclick:${ip}:${code}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      // Jimgina muvaffaqiyat qaytaramiz (attacker'ga limitni bildirmaymiz),
      // lekin klikni SANAMAYMIZ.
      return jsonResponse({ success: true });
    }

    await trackClick(code);
    return jsonResponse({ success: true });
  } catch (err) {
    if (err instanceof InvalidReferralCodeError) {
      return jsonResponse({ error: err.message, code: err.code }, { status: 404 });
    }
    return errorResponse(err);
  }
}
