/** POST /api/profile/2fa/enable — kodni tasdiqlab 2FA yoqadi, zaxira kodlar qaytaradi. */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { enableTwoFactor } from '@/lib/services/twofa.service';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const token = String(body.token ?? '');
    const backupCodes = await enableTwoFactor(session.sub, token);
    return jsonResponse({ success: true, backupCodes });
  } catch (err) {
    return errorResponse(err);
  }
}
