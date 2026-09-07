/** POST /api/profile/2fa/disable — kod (TOTP yoki zaxira) bilan 2FA'ni o'chiradi. */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { disableTwoFactor } from '@/lib/services/twofa.service';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    await disableTwoFactor(session.sub, String(body.code ?? ''));
    return jsonResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
