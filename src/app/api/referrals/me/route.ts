/**
 * GET /api/referrals/me
 * Foydalanuvchining referral kodi + stats.
 */

import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getMyReferralInfo } from '@/lib/services/referral.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const info = await getMyReferralInfo(session.sub);
    return jsonResponse({ referral: info });
  } catch (err) {
    return errorResponse(err);
  }
}
