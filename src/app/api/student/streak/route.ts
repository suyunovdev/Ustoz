/**
 * GET /api/student/streak
 *
 * Talabaning kunlik faollik streak'i.
 *
 * Auth: JWT
 * Response:
 *   200 StreakData
 *   401 Auth yo'q
 *   500 Server xatosi
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getStreakData } from '@/lib/services/streak.service';
import { jsonResponse } from '@/lib/json';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse(
      { error: 'Autentifikatsiya talab qilinadi' },
      { status: 401 },
    );
  }

  try {
    const data = await getStreakData(session.sub);
    return jsonResponse(data);
  } catch (err) {
    console.error('[GET /api/student/streak]', err);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
