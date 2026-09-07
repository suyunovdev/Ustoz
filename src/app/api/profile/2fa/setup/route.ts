/** POST /api/profile/2fa/setup — TOTP maxfiy kaliti + QR (hali yoqilmaydi). */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { setupTwoFactor } from '@/lib/services/twofa.service';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const data = await setupTwoFactor(session.sub);
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}
