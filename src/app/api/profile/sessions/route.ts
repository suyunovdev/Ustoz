/**
 * GET /api/profile/sessions — foydalanuvchining faol qurilmalari (joriysi belgilangan).
 */
import type { NextRequest } from 'next/server';
import { requireAuth, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { listUserSessions } from '@/lib/services/session.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    const sessions = await listUserSessions(session.sub, session.jti);
    return jsonResponse({ sessions });
  } catch (err) {
    return errorResponse(err);
  }
}
