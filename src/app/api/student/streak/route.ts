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
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { getStreakData } from '@/lib/services/streak.service';
import { jsonResponse } from '@/lib/json';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const data = await getStreakData(session.sub);
    return jsonResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}
