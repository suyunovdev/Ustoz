/**
 * GET /api/student/streak
 * Talabaning streak ma'lumotlari.
 */
import type { NextRequest } from 'next/server';
import { requireStudent, errorResponse } from '@/lib/auth-helpers';
import { jsonResponse } from '@/lib/json';
import { getStreakData } from '@/lib/services/streak.service';

export async function GET(req: NextRequest) {
  try {
    const session = await requireStudent(req);
    const streak = await getStreakData(session.sub);
    return jsonResponse(streak);
  } catch (err) {
    return errorResponse(err);
  }
}
