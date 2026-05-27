/**
 * GET /api/student/activity?days=90
 *
 * Heatmap uchun: oxirgi N kun ichidagi faol kunlar (bo'sh kunlar yo'q).
 *
 * Query:
 *   days — default 90, max 365
 *
 * Auth: JWT
 * Response:
 *   200 { days: number, activities: ActivityRecord[] }
 *   401 Auth yo'q
 *   500 Server xatosi
 */

import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getActivityCalendar } from '@/lib/services/streak.service';
import { jsonResponse } from '@/lib/json';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return jsonResponse(
      { error: 'Autentifikatsiya talab qilinadi' },
      { status: 401 },
    );
  }

  const daysParam = req.nextUrl.searchParams.get('days');
  const parsed = Number(daysParam);
  const days = Math.min(
    Math.max(Number.isFinite(parsed) && parsed > 0 ? parsed : 90, 1),
    365,
  );

  try {
    const activities = await getActivityCalendar(session.sub, days);
    return jsonResponse({ days, activities });
  } catch (err) {
    console.error('[GET /api/student/activity]', err);
    return jsonResponse({ error: 'Server xatosi' }, { status: 500 });
  }
}
