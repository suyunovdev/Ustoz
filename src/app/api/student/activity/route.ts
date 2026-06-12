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
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { getActivityCalendar } from '@/lib/services/streak.service';
import { jsonResponse } from '@/lib/json';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);

    const daysParam = req.nextUrl.searchParams.get('days');
    const parsed = Number(daysParam);
    const days = Math.min(
      Math.max(Number.isFinite(parsed) && parsed > 0 ? parsed : 90, 1),
      365,
    );

    const activities = await getActivityCalendar(session.sub, days);
    return jsonResponse({ days, activities });
  } catch (err) {
    return errorResponse(err);
  }
}
